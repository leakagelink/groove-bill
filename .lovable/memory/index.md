# Memory: index.md
Updated: just now

# Project Memory

## Core
CharBhuja Billing System on homemuse.in. Supabase backend.
Design: Deep teal & slate colors. Mobile-first: table to cards, 16px inputs.
Branding: White-labeled "CharBhuja". "CB" favicon. No Lovable tags.
Supabase Fix: ALL API traffic must use `src/lib/proxy-patch.ts` Cloudflare proxy.

## Memories
- [Bill Printing](mem://features/printing) — A5 size bill printing with CHR branding and optional price display
- [WhatsApp Integration](mem://features/whatsapp-integration) — Share invoices directly to customers via WhatsApp with CHR branding
- [Authentication Flow](mem://features/auth) — Admin-only account creation, no signup page, immediate email updates
- [Sales Logic](mem://features/sales-logic) — Auto invoice numbering (CB-0001), automatic calculations, inline entity creation
- [Purchase Master](mem://features/purchase-master) — Supplier data filtering, form auto-population, and admin-only deletion
- [Product Master](mem://features/product-master) — Shortcut for inline brand creation during product entry
- [Supabase Connectivity Proxy](mem://tech/connectivity-proxy) — Bypasses ISP blocks in India using Cloudflare Worker proxy
- [Role-Based Access Control (RBAC)](mem://tech/rbac) — 3-tier roles (Admin, Editor, Viewer), RLS policies, useUserRole hook
- [Android App Build](mem://tech/android-build) — Capacitor configuration loading production domain directly
- [Customer Master](mem://features/customer-master) — Tracks paid/unpaid bills and customer summaries
- [Quotation Maker](mem://features/quotation-maker) — Generate quotations with auto-numbering (QT-0001), A5 printing, WhatsApp
- [Payment Tracking](mem://features/payment-tracking) — Payment methods (Cash, Online, Card, UPI, Cheque) and status tracking
- [Reports](mem://features/reports) — Sales, Purchase, Summary + Closing Stock report with group/product/account/date filters and CSV export
