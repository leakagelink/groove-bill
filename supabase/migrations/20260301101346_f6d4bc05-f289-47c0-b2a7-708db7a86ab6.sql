
-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own brands" ON public.brands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brands" ON public.brands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brands" ON public.brands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brands" ON public.brands FOR DELETE USING (auth.uid() = user_id);

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gst_number TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  brand_name TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT DEFAULT '',
  date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_discount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-- Invoice counter table
CREATE TABLE public.invoice_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  counter INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own counter" ON public.invoice_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own counter" ON public.invoice_counters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own counter" ON public.invoice_counters FOR UPDATE USING (auth.uid() = user_id);
