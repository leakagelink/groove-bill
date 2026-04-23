CREATE TABLE IF NOT EXISTS public.debit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  note_number text NOT NULL,
  note_date text NOT NULL,
  note_type text NOT NULL DEFAULT 'purchase_return',
  ref_bill_no text DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  net_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all debit_notes"
ON public.debit_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and editor can insert debit_notes"
ON public.debit_notes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update debit_notes"
ON public.debit_notes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin can delete debit_notes"
ON public.debit_notes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.debit_note_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  counter integer NOT NULL DEFAULT 0
);

ALTER TABLE public.debit_note_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all dn counters"
ON public.debit_note_counters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and editor can insert dn counters"
ON public.debit_note_counters FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update dn counters"
ON public.debit_note_counters FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));