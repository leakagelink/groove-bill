import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/ProductMaster";
import BrandMaster from "./pages/BrandMaster";
import SupplierMaster from "./pages/SupplierMaster";
import PurchaseMaster from "./pages/PurchaseMaster";
import SalesMaster from "./pages/SalesMaster";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductMaster />} />
            <Route path="/brands" element={<BrandMaster />} />
            <Route path="/suppliers" element={<SupplierMaster />} />
            <Route path="/purchases" element={<PurchaseMaster />} />
            <Route path="/sales" element={<SalesMaster />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
