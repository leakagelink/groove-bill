-- Create product_groups table
CREATE TABLE public.product_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all product_groups"
ON public.product_groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and editor can insert product_groups"
ON public.product_groups FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update product_groups"
ON public.product_groups FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin can delete product_groups"
ON public.product_groups FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new columns to products table
ALTER TABLE public.products
  ADD COLUMN group_id UUID,
  ADD COLUMN group_name TEXT DEFAULT '',
  ADD COLUMN selling_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN purchase_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN hsn_sac TEXT DEFAULT '',
  ADD COLUMN tax_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN opening_stock NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'goods',
  ADD COLUMN unit TEXT DEFAULT 'pcs';