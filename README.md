# DropYourSaaS (`dropyoursaas.co.za`)

An independent African software discovery publication and directory built with **TanStack Start SSR**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**.

---

## 1. Architectural Highlights

- **Server-Side Rendering (SSR):** Powered by TanStack Start on Vite 6 with server-side metadata generation and stream rendering.
- **Zero AI Slop UI:** Clean, content-first typography, 1px solid hairline borders, monospaced tabular accents, zero gratuitous gradient banners, colored icon circles, or vanity stat counters.
- **Dual Provenance Model:** Explicit separation of engineering origin (`country_built_id`) from regional market availability (`product_countries_served`).
- **Strict Verification Protocol:** Candidate entries are staged as unverified drafts (`verification_status = 'unverified'`, `last_verified_at = NULL`). Verification requires human check of active HTTPS URLs, public pricing transparency, and verified builder attribution.
- **Hardened Database Security:** 
  - Zero-argument `public.is_admin()` security definer function reading `app_roles`.
  - Column-level privilege isolation revoking `INSERT`, `UPDATE`, and `DELETE` on sensitive audit columns from public roles.
  - Public queries routed through safe view `public.public_products` with column-level restrictions.
  - Moderation queue actions restricted to atomic RPCs (`approve_submission_to_draft`, `reject_submission`).

---

## 2. Project Structure

```
Dropyoursaas/
├── public/
│   ├── robots.txt            # Search engine directives (disallows /admin/)
│   └── sitemap.xml           # XML sitemap covering all canonical routes
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Brand mark, semantic nav, submit CTA
│   │   ├── Footer.tsx        # Categorical index, regional hubs, editorial disclosure
│   │   ├── ProductCard.tsx   # Reference product display card
│   │   └── SpecificationSheet.tsx # 2-column technical spec sheet for product profiles
│   ├── lib/
│   │   ├── types.ts          # Strongly typed domain entities & enums
│   │   ├── constants.ts      # 20 audited candidates, fallback taxonomies, resources
│   │   ├── supabase.ts       # Supabase client with offline graceful fallbacks
│   │   └── seo.ts            # Schema.org JSON-LD builders (SoftwareApplication, Breadcrumb, Article)
│   ├── routes/
│   │   ├── __root.tsx        # Document HTML root layout
│   │   ├── index.tsx         # Homepage with market hubs, featured verified tools
│   │   ├── discover.tsx      # Multi-dimensional directory search & filtering
│   │   ├── products/
│   │   │   └── $slug.tsx     # Canonical product profile with JSON-LD
│   │   ├── countries/
│   │   │   └── $slug.tsx     # Country hub (Built in vs. Available in)
│   │   ├── categories/
│   │   │   └── $slug.tsx     # Category taxonomy hub
│   │   ├── resources/
│   │   │   ├── index.tsx     # Buyer guides index
│   │   │   └── $slug.tsx     # Technical buyer checklist article view
│   │   ├── submit.tsx        # Submission form with honeypot anti-spam
│   │   └── admin/
│   │       ├── index.tsx     # Moderation queue & candidate catalog manager
│   │       └── login.tsx     # Supabase Auth admin sign-in
│   ├── router.tsx            # TanStack Router instance & type declarations
│   ├── entry-client.tsx      # Browser hydration entry
│   ├── entry-server.tsx      # SSR streaming handler entry
│   └── styles/
│       └── globals.css       # Tailwind base, hairline borders, tabular fonts
├── supabase/
│   └── migrations/
│       ├── 20261102000001_initial_schema.sql         # Tables, enums, RLS, RPCs, views
│       └── 20261102000002_seed_taxonomy_and_candidates.sql # 5 countries, 9 categories, 20 draft candidates
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 3. Getting Started

### Prerequisites
- Node.js 20+ (Node.js 24 supported)
- npm or bun

### Local Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```
Visit `http://localhost:3000` to browse the directory with the 20 audited candidates and buyer guides.

### Build for Production
```bash
npm run build
```
Builds both client hydration bundle (`dist/client/`) and dedicated SSR bundle (`dist/server/entry-server.js`).

---

## 4. Database Setup & Supabase Connection

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run the migrations in the SQL Editor or via the Supabase CLI:
   - `supabase/migrations/20261102000001_initial_schema.sql`
   - `supabase/migrations/20261102000002_seed_taxonomy_and_candidates.sql`
3. Create an admin user in Supabase Auth (e.g. `editor@dropyoursaas.co.za`), then assign the admin role:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<your-user-id-from-auth.users>', 'admin');
   ```
4. Copy `.env.example` to `.env` and fill in your Supabase project URL and keys.

---

## 5. Candidate Backlog Staged (20 Audited Tools)

| Product | Provenance | Category | Pricing Model | Staged Status |
| :--- | :--- | :--- | :--- | :--- |
| **QuickBridge** | South Africa 🇿🇦 | Developer Tools | Free | Draft / Staged |
| **NeuroLint** | South Africa 🇿🇦 | Developer Tools | Free | Draft / Staged |
| **Pillbig** | South Africa 🇿🇦 | Business Operations | Free | Draft / Staged |
| **CalmPC** | South Africa 🇿🇦 | Productivity Tools | Free | Draft / Staged |
| **SuperK53** | South Africa 🇿🇦 | Education & Training | Freemium | Draft / Staged |
| **CalmClip** | South Africa 🇿🇦 | Productivity & Creative | Freemium | Draft / Staged |
| **Paystack** | Nigeria 🇳🇬 | Payments & Fintech | Usage-Based | Draft / Staged |
| **Flutterwave** | Nigeria 🇳🇬 | Payments & Fintech | Usage-Based | Draft / Staged |
| **Yoco** | South Africa 🇿🇦 | Payments & Fintech | Usage-Based | Draft / Staged |
| **Ozow** | South Africa 🇿🇦 | Payments & Fintech | Usage-Based | Draft / Staged |
| **Peach Payments** | South Africa 🇿🇦 | Payments & Fintech | Contact for Pricing | Draft / Staged |
| **Stitch** | South Africa 🇿🇦 | Payments & Fintech | Contact for Pricing | Draft / Staged |
| **Mono** | Nigeria 🇳🇬 | Payments & Fintech | Paid Subscription | Draft / Staged |
| **Workpay** | Kenya 🇰🇪 | HR & Payroll | Paid Subscription | Draft / Staged |
| **SeamlessHR** | Nigeria 🇳🇬 | HR & Payroll | Contact for Pricing | Draft / Staged |
| **Jem HR** | South Africa 🇿🇦 | HR & Payroll | Contact for Pricing | Draft / Staged |
| **Termii** | Nigeria 🇳🇬 | Communications APIs | Usage-Based | Draft / Staged |
| **Africa's Talking** | Kenya 🇰🇪 | Communications APIs | Usage-Based | Draft / Staged |
| **Luciq** | Egypt 🇪🇬 | Developer Tools | Contact for Pricing | Draft / Staged |
| **Hubtel** | Ghana 🇬🇭 | Payments & Fintech | Usage-Based | Draft / Staged |
