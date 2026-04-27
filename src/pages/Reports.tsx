import { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { Sale, Purchase, Product, ProductGroup } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, Filter, TrendingUp, TrendingDown, IndianRupee, BarChart3, Package } from 'lucide-react';

type ReportTab = 'sales' | 'purchases' | 'summary' | 'closing';
type ViewType = 'summary' | 'detailed';

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [tab, setTab] = useState<ReportTab>('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Closing stock filters
  const [csGroupId, setCsGroupId] = useState('all');
  const [csProductId, setCsProductId] = useState('all');
  const [csViewType, setCsViewType] = useState<ViewType>('summary');
  const [csAccount, setCsAccount] = useState('all');
  const [csOnlyNegative, setCsOnlyNegative] = useState(false);
  const [csShowZero, setCsShowZero] = useState(true);
  const [csIncludeAccount, setCsIncludeAccount] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, pr, g] = await Promise.all([
          store.getSales(), store.getPurchases(), store.getProducts(), store.getProductGroups()
        ]);
        setSales(s); setPurchases(p); setProducts(pr); setGroups(g);
      } catch (e: any) {
        toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
      }
    };
    load();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo, paymentFilter]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (dateFrom && p.date < dateFrom) return false;
      if (dateTo && p.date > dateTo) return false;
      if (paymentFilter !== 'all' && p.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [purchases, dateFrom, dateTo, paymentFilter]);

  const salesTotal = filteredSales.reduce((s, i) => s + i.finalAmount, 0);
  const salesDiscount = filteredSales.reduce((s, i) => s + i.totalDiscount, 0);
  const purchaseTotal = filteredPurchases.reduce((s, i) => s + i.totalAmount, 0);
  const profit = salesTotal - purchaseTotal;

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { sales: number; purchases: number }> = {};
    filteredSales.forEach(s => {
      const m = s.paymentMethod || 'cash';
      if (!methods[m]) methods[m] = { sales: 0, purchases: 0 };
      methods[m].sales += s.finalAmount;
    });
    filteredPurchases.forEach(p => {
      const m = p.paymentMethod || 'cash';
      if (!methods[m]) methods[m] = { sales: 0, purchases: 0 };
      methods[m].purchases += p.totalAmount;
    });
    return methods;
  }, [filteredSales, filteredPurchases]);

  const customerWise = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number; paid: number; unpaid: number }> = {};
    filteredSales.forEach(s => {
      const key = s.customerName || 'Unknown';
      if (!map[key]) map[key] = { name: key, total: 0, count: 0, paid: 0, unpaid: 0 };
      map[key].total += s.finalAmount;
      map[key].count++;
      if (s.paymentStatus === 'paid') map[key].paid += s.finalAmount;
      else map[key].unpaid += s.finalAmount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredSales]);

  const supplierWise = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    filteredPurchases.forEach(p => {
      const key = p.supplierName || 'Unknown';
      if (!map[key]) map[key] = { name: key, total: 0, count: 0 };
      map[key].total += p.totalAmount;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  // Account list (from sales customers + purchase suppliers)
  const accountList = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => s.customerName && set.add(s.customerName));
    purchases.forEach(p => p.supplierName && set.add(p.supplierName));
    return Array.from(set).sort();
  }, [sales, purchases]);

  // Closing Stock calculation
  const closingStockRows = useMemo(() => {
    // Filter products by group/product
    let prodList = products;
    if (csGroupId !== 'all') prodList = prodList.filter(p => p.groupId === csGroupId);
    if (csProductId !== 'all') prodList = prodList.filter(p => p.id === csProductId);

    return prodList.map(p => {
      const opening = Number(p.openingStock || 0);
      let purchased = 0;
      let purchaseValue = 0;
      let sold = 0;
      let salesValue = 0;
      let accountMatched = false;

      purchases.forEach(pur => {
        if (dateFrom && pur.date < dateFrom) return;
        if (dateTo && pur.date > dateTo) return;
        if (csAccount !== 'all' && pur.supplierName !== csAccount) return;
        pur.items.forEach(it => {
          if (it.productId === p.id) {
            purchased += Number(it.quantity || 0);
            purchaseValue += Number(it.total || 0);
            if (csAccount !== 'all' && pur.supplierName === csAccount) accountMatched = true;
          }
        });
      });

      sales.forEach(sa => {
        if (dateFrom && sa.date < dateFrom) return;
        if (dateTo && sa.date > dateTo) return;
        if (csAccount !== 'all' && sa.customerName !== csAccount) return;
        sa.items.forEach(it => {
          if (it.productId === p.id) {
            sold += Number(it.quantity || 0);
            salesValue += Number(it.total || 0);
            if (csAccount !== 'all' && sa.customerName === csAccount) accountMatched = true;
          }
        });
      });

      const closingQty = opening + purchased - sold;
      const rate = Number(p.purchasePrice || p.price || 0);
      const closingValue = closingQty * rate;

      return {
        id: p.id,
        name: p.name,
        groupName: p.groupName || '-',
        unit: p.unit || 'pcs',
        opening, purchased, sold, closingQty, closingValue,
        purchaseValue, salesValue, rate, accountMatched,
      };
    }).filter(r => {
      if (csOnlyNegative && r.closingQty >= 0) return false;
      if (!csShowZero && r.closingQty === 0) return false;
      if (csAccount !== 'all' && csIncludeAccount && !r.accountMatched) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, purchases, sales, csGroupId, csProductId, csAccount, csOnlyNegative, csShowZero, csIncludeAccount, dateFrom, dateTo]);

  const closingTotalQty = closingStockRows.reduce((s, r) => s + r.closingQty, 0);
  const closingTotalValue = closingStockRows.reduce((s, r) => s + r.closingValue, 0);

  const downloadCSV = (type: 'sales' | 'purchases' | 'closing') => {
    let csv = '';
    let fname = `${type}-report.csv`;
    if (type === 'sales') {
      csv = 'Invoice,Date,Customer,Phone,Payment Method,Payment Status,Amount,Discount,Final Amount\n';
      filteredSales.forEach(s => {
        csv += `${s.invoiceNumber},${s.date},${s.customerName},${s.customerPhone},${s.paymentMethod || 'cash'},${s.paymentStatus},${s.totalAmount},${s.totalDiscount},${s.finalAmount}\n`;
      });
    } else if (type === 'purchases') {
      csv = 'Date,Supplier,Payment Method,Items,Total Amount\n';
      filteredPurchases.forEach(p => {
        csv += `${p.date},${p.supplierName},${p.paymentMethod || 'cash'},${p.items.length},${p.totalAmount}\n`;
      });
    } else {
      csv = 'Product,Group,Unit,Opening,Purchased,Sold,Closing Qty,Rate,Closing Value\n';
      closingStockRows.forEach(r => {
        csv += `${r.name},${r.groupName},${r.unit},${r.opening},${r.purchased},${r.sold},${r.closingQty},${r.rate},${r.closingValue.toFixed(2)}\n`;
      });
      fname = 'closing-stock-report.csv';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setQuickDate = (period: string) => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateTo(fmt(today));
    if (period === 'today') setDateFrom(fmt(today));
    else if (period === 'week') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      setDateFrom(fmt(d));
    } else if (period === 'month') {
      setDateFrom(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
    } else if (period === 'year') {
      setDateFrom(fmt(new Date(today.getFullYear(), 0, 1)));
    } else {
      setDateFrom(''); setDateTo('');
    }
  };

  // Products filtered for product dropdown based on selected group
  const productOptions = useMemo(() => {
    if (csGroupId === 'all') return products;
    return products.filter(p => p.groupId === csGroupId);
  }, [products, csGroupId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
      </div>

      {/* Filters - hide payment filter on closing tab */}
      <div className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter size={16} /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'today', 'week', 'month', 'year'].map(p => (
            <Button key={p} size="sm" variant={
              (p === 'all' && !dateFrom && !dateTo) ? 'default' : 'outline'
            } onClick={() => setQuickDate(p)} className="capitalize text-xs">
              {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Today'}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9" />
          </div>
          {tab !== 'closing' && (
            <div>
              <label className="text-xs text-muted-foreground">Payment Method</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          )}
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setDateFrom(''); setDateTo(''); setPaymentFilter('all'); }}>Clear</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 flex-wrap">
        {([['summary', 'Summary'], ['sales', 'Sales Report'], ['purchases', 'Purchase Report'], ['closing', 'Closing Stock']] as [ReportTab, string][]).map(([key, label]) => (
          <Button key={key} variant={tab === key ? 'default' : 'ghost'} size="sm" onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp size={14} className="text-green-500" /> Total Sales</div>
              <p className="text-xl font-bold text-foreground mt-1">₹{salesTotal.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{filteredSales.length} bills</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown size={14} className="text-red-500" /> Total Purchase</div>
              <p className="text-xl font-bold text-foreground mt-1">₹{purchaseTotal.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{filteredPurchases.length} bills</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><IndianRupee size={14} /> Discount Given</div>
              <p className="text-xl font-bold text-destructive mt-1">₹{salesDiscount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 size={14} className={profit >= 0 ? 'text-green-500' : 'text-red-500'} /> Profit/Loss</div>
              <p className={`text-xl font-bold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{profit >= 0 ? 'Profit' : 'Loss'}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold text-foreground mb-3">Payment Method Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium text-muted-foreground">Method</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Sales</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentBreakdown).map(([method, data]) => (
                    <tr key={method} className="border-b">
                      <td className="p-2 capitalize text-foreground">{method}</td>
                      <td className="p-2 text-right text-green-600">₹{data.sales.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right text-red-600">₹{data.purchases.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-foreground mb-3">Customer Wise Sales</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customerWise.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : customerWise.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-dashed last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({c.count} bills)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">₹{c.total.toLocaleString('en-IN')}</span>
                      {c.unpaid > 0 && <span className="text-xs text-orange-600 ml-2">Due: ₹{c.unpaid.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-foreground mb-3">Supplier Wise Purchases</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {supplierWise.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : supplierWise.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-dashed last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({s.count} bills)</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">₹{s.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Tab */}
      {tab === 'sales' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{filteredSales.length} sales • Total: ₹{salesTotal.toLocaleString('en-IN')}</p>
            <Button size="sm" variant="outline" onClick={() => downloadCSV('sales')}><Download size={14} className="mr-1" /> Export CSV</Button>
          </div>
          <div className="bg-card rounded-lg border">
            <div className="divide-y sm:hidden">
              {filteredSales.length === 0 && <p className="p-4 text-sm text-muted-foreground">No sales found</p>}
              {filteredSales.map(s => (
                <div key={s.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-primary">{s.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">{s.customerName}</span>
                    <span className="font-medium text-foreground text-sm">₹{s.finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{s.paymentMethod || 'cash'}</span>
                    <span className={s.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}>{s.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Payment</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Discount</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Final</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredSales.length === 0 && <tr><td colSpan={8} className="p-4 text-muted-foreground">No sales found</td></tr>}
                  {filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-sm text-primary">{s.invoiceNumber}</td>
                      <td className="p-3 text-foreground">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-foreground">{s.customerName}</td>
                      <td className="p-3 text-muted-foreground capitalize">{s.paymentMethod || 'cash'}</td>
                      <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{s.paymentStatus}</span></td>
                      <td className="p-3 text-right text-muted-foreground">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-destructive">₹{s.totalDiscount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{s.finalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Report Tab */}
      {tab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{filteredPurchases.length} purchases • Total: ₹{purchaseTotal.toLocaleString('en-IN')}</p>
            <Button size="sm" variant="outline" onClick={() => downloadCSV('purchases')}><Download size={14} className="mr-1" /> Export CSV</Button>
          </div>
          <div className="bg-card rounded-lg border">
            <div className="divide-y sm:hidden">
              {filteredPurchases.length === 0 && <p className="p-4 text-sm text-muted-foreground">No purchases found</p>}
              {filteredPurchases.map(p => (
                <div key={p.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">{p.supplierName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">{p.items.length} items • {p.paymentMethod || 'cash'}</span>
                    <span className="font-medium text-foreground text-sm">₹{p.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Payment</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Items</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredPurchases.length === 0 && <tr><td colSpan={5} className="p-4 text-muted-foreground">No purchases found</td></tr>}
                  {filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3 text-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-foreground">{p.supplierName}</td>
                      <td className="p-3 text-muted-foreground capitalize">{p.paymentMethod || 'cash'}</td>
                      <td className="p-3 text-right text-muted-foreground">{p.items.length}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{p.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Closing Stock Tab */}
      {tab === 'closing' && (
        <div className="space-y-4">
          {/* Closing-specific filters */}
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Package size={16} /> Closing Stock Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Product Group</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={csGroupId} onChange={e => { setCsGroupId(e.target.value); setCsProductId('all'); }}>
                  <option value="all">All Groups</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Product</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={csProductId} onChange={e => setCsProductId(e.target.value)}>
                  <option value="all">All Products</option>
                  {productOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">View Type</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={csViewType} onChange={e => setCsViewType(e.target.value as ViewType)}>
                  <option value="summary">Summary</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Account</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={csAccount} onChange={e => setCsAccount(e.target.value)}>
                  <option value="all">All Accounts</option>
                  {accountList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={csOnlyNegative} onCheckedChange={v => setCsOnlyNegative(!!v)} />
                Show only negative stock
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={csShowZero} onCheckedChange={v => setCsShowZero(!!v)} />
                Show zero balance account
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={csIncludeAccount} onCheckedChange={v => setCsIncludeAccount(!!v)} />
                Show including account
              </label>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-card rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Total Products</div>
              <p className="text-xl font-bold text-foreground mt-1">{closingStockRows.length}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Total Closing Qty</div>
              <p className="text-xl font-bold text-foreground mt-1">{closingTotalQty.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Total Closing Value</div>
              <p className="text-xl font-bold text-foreground mt-1">₹{closingTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{closingStockRows.length} items • View: <span className="capitalize font-medium">{csViewType}</span></p>
            <Button size="sm" variant="outline" onClick={() => downloadCSV('closing')}><Download size={14} className="mr-1" /> Export CSV</Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Group</th>
                  {csViewType === 'detailed' && <>
                    <th className="text-right p-3 font-medium text-muted-foreground">Opening</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Purchased</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Sold</th>
                  </>}
                  <th className="text-right p-3 font-medium text-muted-foreground">Closing Qty</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Unit</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Rate</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Closing Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {closingStockRows.length === 0 && (
                  <tr><td colSpan={csViewType === 'detailed' ? 9 : 6} className="p-4 text-center text-muted-foreground">No stock data found</td></tr>
                )}
                {closingStockRows.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{r.name}</td>
                    <td className="p-3 text-muted-foreground">{r.groupName}</td>
                    {csViewType === 'detailed' && <>
                      <td className="p-3 text-right text-muted-foreground">{r.opening}</td>
                      <td className="p-3 text-right text-green-600">+{r.purchased}</td>
                      <td className="p-3 text-right text-red-600">-{r.sold}</td>
                    </>}
                    <td className={`p-3 text-right font-semibold ${r.closingQty < 0 ? 'text-destructive' : r.closingQty === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {r.closingQty}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{r.unit}</td>
                    <td className="p-3 text-right text-muted-foreground">₹{r.rate.toLocaleString('en-IN')}</td>
                    <td className={`p-3 text-right font-medium ${r.closingValue < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      ₹{r.closingValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              {closingStockRows.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td colSpan={csViewType === 'detailed' ? 5 : 2} className="p-3 text-foreground">Total</td>
                    <td className="p-3 text-right text-foreground">{closingTotalQty}</td>
                    <td colSpan={2}></td>
                    <td className="p-3 text-right text-foreground">₹{closingTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
