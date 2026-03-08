
CREATE TABLE public.quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quotation_number text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  customer_address text DEFAULT '',
  date text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  total_discount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  valid_until text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and editor can insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admin and editor can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admin can delete quotations" ON public.quotations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.quotation_counters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  counter integer NOT NULL DEFAULT 0
);

ALTER TABLE public.quotation_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all qcounters" ON public.quotation_counters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and editor can insert qcounters" ON public.quotation_counters FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admin and editor can update qcounters" ON public.quotation_counters FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
