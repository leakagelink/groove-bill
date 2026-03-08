import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Sale, Customer } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, IndianRupee, CheckCircle2, Clock, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BillPrint from '@/components/BillPrint';

type FilterType = 'all' | 'paid' | 'unpaid';

export default function CustomerMaster() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printWithPrice, setPrintWithPrice] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([store.getCustomers(), store.getSales()]);
      setCustomers(c);
      setSales(s);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => { loadData(); }, []);

  const togglePaymentStatus = async (sale: Sale) => {
    const newStatus = sale.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      await store.updateSalePaymentStatus(sale.id, newStatus);
      setSales(sales.map(s => s.id === sale.id ? { ...s, paymentStatus: newStatus } : s));
      toast({ title: `Bill marked as ${newStatus}` });
    } catch (e: any) {
      toast({ title: 'Error updating status', description: e.message, variant: 'destructive' });
    }
  };

  const getCustomerSales = (customerId: string) =>
    sales.filter(s => s.customerId === customerId);

  const getCustomerSummary = (customerId: string) => {
    const customerSales = getCustomerSales(customerId);
    const totalBills = customerSales.length;
    const paidBills = customerSales.filter(s => s.paymentStatus === 'paid').length;
    const unpaidBills = totalBills - paidBills;
    const totalAmount = customerSales.reduce((sum, s) => sum + s.finalAmount, 0);
    const paidAmount = customerSales.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.finalAmount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    return { totalBills, paidBills, unpaidBills, totalAmount, paidAmount, unpaidAmount };
  };

  // Filter all sales based on filter type
  const filteredSales = sales.filter(s => {
    if (filter === 'paid') return s.paymentStatus === 'paid';
    if (filter === 'unpaid') return s.paymentStatus === 'unpaid';
    return true;
  });

  // Get unique customer IDs from filtered sales
  const customerIdsWithFilteredSales = new Set(filteredSales.map(s => s.customerId));

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    if (filter === 'all') return matchesSearch;
    return matchesSearch && customerIdsWithFilteredSales.has(c.id);
  });

  const selectedCustomerSales = selectedCustomer
    ? getCustomerSales(selectedCustomer.id).filter(s => {
        if (filter === 'paid') return s.paymentStatus === 'paid';
        if (filter === 'unpaid') return s.paymentStatus === 'unpaid';
        return true;
      })
    : [];

  if (selectedCustomer) {
    const summary = getCustomerSummary(selectedCustomer.id);
    return (
      <div className="space-y-6">
        {printSale && <BillPrint sale={printSale} showPrice={printWithPrice} onClose={() => setPrintSale(null)} />}

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
            <ChevronLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{selectedCustomer.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Bills</p>
            <p className="text-xl font-bold text-foreground">{summary.totalBills}</p>
            <p className="text-xs text-muted-foreground">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Paid</p>
            <p className="text-xl font-bold text-green-600">{summary.paidBills}</p>
            <p className="text-xs text-muted-foreground">₹{summary.paidAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} className="text-orange-500" /> Unpaid</p>
            <p className="text-xl font-bold text-orange-600">{summary.unpaidBills}</p>
            <p className="text-xs text-muted-foreground">₹{summary.unpaidAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'paid', 'unpaid'] as FilterType[]).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f === 'all' ? 'All Bills' : f}
            </Button>
          ))}
        </div>

        {/* Bills list */}
        <div className="space-y-3">
          {selectedCustomerSales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bills found</p>
          ) : (
            selectedCustomerSales.map(sale => (
              <div key={sale.id} className="bg-card rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">{sale.invoiceNumber}</span>
                    <span className="text-sm text-muted-foreground ml-3">{new Date(sale.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {sale.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {sale.items.map((item, i) => (
                    <span key={i}>{item.productName} x{item.quantity}{i < sale.items.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-bold text-foreground">₹{sale.finalAmount.toLocaleString('en-IN')}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setPrintWithPrice(true); setPrintSale(sale); }}>
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant={sale.paymentStatus === 'paid' ? 'outline' : 'default'}
                      onClick={() => togglePaymentStatus(sale)}
                    >
                      {sale.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Customer Master</h1>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'paid', 'unpaid'] as FilterType[]).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customer name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="divide-y">
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customers found</p>
          ) : (
            filteredCustomers.map(customer => {
              const summary = getCustomerSummary(customer.id);
              return (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">{summary.paidBills} paid</span>
                        {summary.unpaidBills > 0 && (
                          <span className="text-orange-600">{summary.unpaidBills} unpaid</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {summary.unpaidAmount > 0 && (
                    <div className="mt-1 text-xs text-orange-600 font-medium">
                      Due: ₹{summary.unpaidAmount.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
