ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS opening_balance numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.other_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  group_name text DEFAULT '',
  account_type text NOT NULL DEFAULT 'asset',
  opening_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.other_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all other_accounts"
ON public.other_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and editor can insert other_accounts"
ON public.other_accounts FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin and editor can update other_accounts"
ON public.other_accounts FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admin can delete other_accounts"
ON public.other_accounts FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));