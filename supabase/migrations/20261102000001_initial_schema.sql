-- ============================================================================
-- DROP YOUR SAAS - MIGRATION 1: INITIAL SCHEMA & MANDATORY RLS SECURITY
-- Execution Date: November 2026
-- Blueprint Reference: MVP Implementation Specification v1.2 Locked
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.publication_status_enum AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.verification_status_enum AS ENUM ('unverified', 'community_submitted', 'verified');
CREATE TYPE public.operational_status_enum AS ENUM ('active', 'beta', 'discontinued');
CREATE TYPE public.submission_status_enum AS ENUM ('pending', 'approved', 'rejected', 'spam');
CREATE TYPE public.app_role_enum AS ENUM ('admin');
CREATE TYPE public.pricing_model_enum AS ENUM (
    'free',
    'freemium',
    'free_trial',
    'paid_subscription',
    'usage_based',
    'contact_for_pricing'
);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 1. countries
CREATE TABLE public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    iso_code_2 CHAR(2) NOT NULL UNIQUE,
    currency_code CHAR(3) NOT NULL,
    flag_emoji VARCHAR(10),
    meta_title VARCHAR(150),
    meta_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. categories (NO icon_name column; categories are pure editorial taxonomy)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    meta_title VARCHAR(150),
    meta_description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    tagline VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    website_url VARCHAR(500) NOT NULL CHECK (website_url ~* '^https://'),
    logo_url VARCHAR(500),
    screenshot_url VARCHAR(500),

    primary_category_id UUID NOT NULL REFERENCES public.categories(id),
    country_built_id UUID NOT NULL REFERENCES public.countries(id),

    builder_name VARCHAR(150),
    builder_url VARCHAR(500),
    builder_twitter VARCHAR(100),
    builder_linkedin VARCHAR(250),
    is_founder_submitted BOOLEAN NOT NULL DEFAULT false,

    pricing_model public.pricing_model_enum NOT NULL DEFAULT 'contact_for_pricing',
    starting_price_display VARCHAR(100),
    pricing_details TEXT,
    supported_payment_gateways TEXT[] NOT NULL DEFAULT '{}',

    platform_type VARCHAR(50),
    is_open_source BOOLEAN NOT NULL DEFAULT false,
    github_url VARCHAR(500),

    publication_status public.publication_status_enum NOT NULL DEFAULT 'draft',
    verification_status public.verification_status_enum NOT NULL DEFAULT 'unverified',
    operational_status public.operational_status_enum NOT NULL DEFAULT 'active',

    -- Private staff audit columns (NEVER publicly readable)
    verified_by VARCHAR(100) DEFAULT NULL,
    verification_notes TEXT DEFAULT NULL,
    verification_evidence_url VARCHAR(500) DEFAULT NULL,
    last_verified_at TIMESTAMPTZ DEFAULT NULL,

    meta_title VARCHAR(150),
    meta_description TEXT,

    published_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_published_category ON public.products(primary_category_id)
    WHERE publication_status = 'published';
CREATE INDEX idx_products_published_country_built ON public.products(country_built_id)
    WHERE publication_status = 'published';

-- 4. product_countries_served (Many-to-Many regional availability)
CREATE TABLE public.product_countries_served (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, country_id)
);

CREATE INDEX idx_pcs_country_id ON public.product_countries_served(country_id);

-- 5. submissions (Locked queue: NO direct public INSERT/SELECT)
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(150) NOT NULL,
    website_url VARCHAR(500) NOT NULL CHECK (website_url ~* '^https://'),
    tagline VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    country_built_id UUID REFERENCES public.countries(id),
    countries_served_ids UUID[] NOT NULL DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id),
    pricing_model public.pricing_model_enum,

    submitter_name VARCHAR(150) NOT NULL,
    submitter_email VARCHAR(150) NOT NULL,
    is_founder BOOLEAN NOT NULL DEFAULT true,

    status public.submission_status_enum NOT NULL DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    submitted_ip_hash VARCHAR(128) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_status_created ON public.submissions(status, created_at DESC);
CREATE INDEX idx_submissions_ip_created ON public.submissions(submitted_ip_hash, created_at DESC);

-- 6. resources (Editorial guides & checklists)
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    cover_image_url VARCHAR(500),
    author_name VARCHAR(100) NOT NULL DEFAULT 'DropYourSaaS Editorial Team',
    publication_status public.publication_status_enum NOT NULL DEFAULT 'draft',
    meta_title VARCHAR(150),
    meta_description TEXT,
    published_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. user_roles & ZERO-PARAMETER is_admin()
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- SECURITY REQUIREMENT: Zero parameters. Always derive identity from auth.uid() internally.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL THEN false
        ELSE EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
        )
    END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Triggers
CREATE TRIGGER trg_countries_updated_at BEFORE UPDATE ON public.countries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on ALL 7 tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_countries_served ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: countries
CREATE POLICY "Public read active countries"
    ON public.countries FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage countries"
    ON public.countries FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS Policies: categories
CREATE POLICY "Public read categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS Policies + Column-Level Privilege Lockdown: products
CREATE POLICY "Public read published products"
    ON public.products FOR SELECT
    USING (publication_status = 'published' OR public.is_admin());

CREATE POLICY "Admins manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Revoke table-wide SELECT so verified_by, verification_notes & verification_evidence_url
-- are NEVER exposed via PostgREST to anon or non-admin authenticated callers.
REVOKE ALL ON public.products FROM anon, authenticated;

GRANT SELECT (
    id, name, slug, tagline, description, website_url, logo_url, screenshot_url,
    primary_category_id, country_built_id,
    builder_name, builder_url, builder_twitter, builder_linkedin, is_founder_submitted,
    pricing_model, starting_price_display, pricing_details, supported_payment_gateways,
    platform_type, is_open_source, github_url,
    publication_status, verification_status, operational_status,
    last_verified_at, meta_title, meta_description,
    published_at, created_at, updated_at
) ON public.products TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- Safe public view (security_invoker = true satisfies Supabase security linter & enforces RLS)
CREATE OR REPLACE VIEW public.public_products
WITH (security_invoker = true)
AS
SELECT
    id, name, slug, tagline, description, website_url, logo_url, screenshot_url,
    primary_category_id, country_built_id,
    builder_name, builder_url, builder_twitter, builder_linkedin, is_founder_submitted,
    pricing_model, starting_price_display, pricing_details, supported_payment_gateways,
    platform_type, is_open_source, github_url,
    publication_status, verification_status, operational_status,
    last_verified_at, meta_title, meta_description,
    published_at, created_at, updated_at
FROM public.products
WHERE publication_status = 'published';

GRANT SELECT ON public.public_products TO anon, authenticated;

-- Admin-only RPCs for reading full product rows (including private verification columns)
CREATE OR REPLACE FUNCTION public.admin_list_products()
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: administrator role required' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT * FROM public.products ORDER BY updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_product(_product_id UUID)
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: administrator role required' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT * FROM public.products WHERE id = _product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_products() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_products() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_get_product(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_product(UUID) TO authenticated;

-- RLS Policies: product_countries_served
CREATE POLICY "Public read served countries for published products"
    ON public.product_countries_served FOR SELECT
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_countries_served.product_id
              AND p.publication_status = 'published'
        )
    );

CREATE POLICY "Admins manage served countries"
    ON public.product_countries_served FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS Policies: resources
CREATE POLICY "Public read published resources"
    ON public.resources FOR SELECT
    USING (publication_status = 'published' OR public.is_admin());

CREATE POLICY "Admins manage resources"
    ON public.resources FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS & Privileges: submissions (ZERO direct public INSERT or SELECT)
REVOKE ALL ON public.submissions FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.submissions TO authenticated;

CREATE POLICY "Admins read and moderate submissions"
    ON public.submissions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS Policies: user_roles
CREATE POLICY "Users read own role or admin reads all"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage user roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
