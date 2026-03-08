import { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { Sale, Purchase } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Filter, TrendingUp, TrendingDown, IndianRupee, BarChart3 } from 'lucide-react';

type ReportTab = 'sales' | 'purchases' | 'summary';

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [tab, setTab] = useState<ReportTab>('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.all([store.getSales(), store.getPurchases()]);
        setSales(s); setPurchases(p);
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

  const downloadCSV = (type: 'sales' | 'purchases') => {
    let csv = '';
    if (type === 'sales') {
      csv = 'Invoice,Date,Customer,Phone,Payment Method,Payment Status,Amount,Discount,Final Amount\n';
      filteredSales.forEach(s => {
        csv += `${s.invoiceNumber},${s.date},${s.customerName},${s.customerPhone},${s.paymentMethod || 'cash'},${s.paymentStatus},${s.totalAmount},${s.totalDiscount},${s.finalAmount}\n`;
      });
    } else {
      csv = 'Date,Supplier,Payment Method,Items,Total Amount\n';
      filteredPurchases.forEach(p => {
        csv += `${p.date},${p.supplierName},${p.paymentMethod || 'cash'},${p.items.length},${p.totalAmount}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.csv`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter size={16} /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'today', 'week', 'month', 'year'].map(p => (
            <Button key={p} size="sm" variant={
              (p === 'all' && !dateFrom && !dateTo) ? 'default' : 
              (p !== 'all' && dateFrom) ? 'outline' : 'outline'
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
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setDateFrom(''); setDateTo(''); setPaymentFilter('all'); }}>Clear</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {([['summary', 'Summary'], ['sales', 'Sales Report'], ['purchases', 'Purchase Report']] as [ReportTab, string][]).map(([key, label]) => (
          <Button key={key} variant={tab === key ? 'default' : 'ghost'} size="sm" onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && (
        <div className="space-y-6">
          {/* Overview Cards */}
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

          {/* Payment Method Breakdown */}
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

          {/* Customer Wise & Supplier Wise side by side */}
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
            {/* Mobile */}
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
            {/* Desktop */}
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
            {/* Mobile */}
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
            {/* Desktop */}
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
    </div>
  );
}
