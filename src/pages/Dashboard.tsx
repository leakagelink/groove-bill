import { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { Package, Tags, Truck, ShoppingCart, Receipt } from 'lucide-react';
import { Product, Brand, Supplier, Purchase, Sale } from '@/types/billing';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, b, s, pu, sa] = await Promise.all([
          store.getProducts(), store.getBrands(), store.getSuppliers(), store.getPurchases(), store.getSales()
        ]);
        setProducts(p); setBrands(b); setSuppliers(s); setPurchases(pu); setSales(sa);
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Products', value: products.length, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Brands', value: brands.length, icon: Tags, color: 'bg-accent/20 text-accent-foreground' },
    { label: 'Suppliers', value: suppliers.length, icon: Truck, color: 'bg-success/10 text-success' },
    { label: 'Purchases', value: purchases.length, icon: ShoppingCart, color: 'bg-primary/10 text-primary' },
    { label: 'Sales', value: sales.length, icon: Receipt, color: 'bg-accent/20 text-accent-foreground' },
  ];

  const totalSalesAmount = sales.reduce((sum, s) => sum + s.finalAmount, 0);
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to CharBhuja Billing System</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-lg border p-4">
            <div className={`w-9 h-9 rounded-md flex items-center justify-center ${s.color} mb-3`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold text-foreground mb-1">Total Purchases</h3>
          <p className="text-2xl font-bold text-primary">₹{totalPurchaseAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold text-foreground mb-1">Total Sales</h3>
          <p className="text-2xl font-bold text-success">₹{totalSalesAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}
