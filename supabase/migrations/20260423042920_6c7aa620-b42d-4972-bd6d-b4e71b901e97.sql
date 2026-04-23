CREATE TABLE IF NOT EXISTS public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  note_number text NOT NULL,
  note_date text NOT NULL,
  note_type text NOT NULL DEFAULT 'sales_return',
  ref_bill_no text DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  net_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all credit_notes"
ON public.credit_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and editor can insert credit_notes"
ON public.credit_notes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update credit_notes"
ON public.credit_notes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin can delete credit_notes"
ON public.credit_notes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.credit_note_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  counter integer NOT NULL DEFAULT 0
);

ALTER TABLE public.credit_note_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all cn counters"
ON public.credit_note_counters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and editor can insert cn counters"
ON public.credit_note_counters FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update cn counters"
ON public.credit_note_counters FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));