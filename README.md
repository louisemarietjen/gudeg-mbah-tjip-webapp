# Gudeg Mbah Tjip Web App

Mobile-first HTML/CSS/JavaScript food-ordering web app.

## Supabase

This version is configured for the existing Gudeg Ndeso Supabase schema (`foods`, `orders`, `order_items`).

Run the SQL in `supabase-schema.sql` in the Supabase SQL Editor. If the tables already exist, the setup statements are safe to re-run; the final GRANT statements are required for the Data API in new Supabase projects.

The frontend uses the Supabase publishable key only. Never put a Supabase secret/service-role key in the browser.

## Test locally

Use VS Code Live Server (or another local HTTP server), then place an order. Check Supabase Table Editor:
- `orders`
- `order_items`

If an order still fails, open the browser console (F12) to see the exact Supabase error.


### v4 fixes
- Matches the current Supabase schema with `orders.order_code` and `order_items.product_id/product_name/unit_price/subtotal`.
- Uses UUID for `orders.id`.
- Uses explicit Rupiah formatting so Nasi Putih displays as Rp 5.000.
- Adds cache-busting query strings to local JS files.
