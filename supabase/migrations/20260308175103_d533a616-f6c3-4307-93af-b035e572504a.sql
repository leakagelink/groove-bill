
ALTER TABLE public.sales ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
ALTER TABLE public.purchases ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
