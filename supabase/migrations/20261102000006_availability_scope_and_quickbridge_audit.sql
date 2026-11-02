-- Migration 6: Availability Scope Enum & QuickBridge Editorial Audit Updates
-- 1. Create availability_scope_enum ('global', 'selected_countries', 'unverified')
-- 2. Add availability_scope to products and submissions
-- 3. Update public_products view to include availability_scope
-- 4. Update submit_product_with_rate_limit to enforce scope-aware country validation
-- 5. Apply QuickBridge editorial audit updates (category -> productivity-tools, scope -> global, clear country-specific links)

DO $$ BEGIN
    CREATE TYPE public.availability_scope_enum AS ENUM ('global', 'selected_countries', 'unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS availability_scope public.availability_scope_enum NOT NULL DEFAULT 'selected_countries';

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS availability_scope public.availability_scope_enum NOT NULL DEFAULT 'selected_countries';

-- Drop and recreate public_products view to include availability_scope
DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products AS
SELECT
    id, name, slug, tagline, description, logo_url, website_url,
    primary_category_id, country_built_id,
    builder_name, builder_url, builder_twitter, builder_linkedin, is_founder_submitted,
    pricing_model, starting_price_display, pricing_details, supported_payment_gateways,
    platform_type, is_open_source, github_url,
    publication_status, verification_status, operational_status,
    availability_scope,
    last_verified_at, meta_title, meta_description,
    published_at, created_at, updated_at
FROM public.products
WHERE publication_status = 'published';

GRANT SELECT ON public.public_products TO anon, authenticated;

-- Drop legacy 14-parameter function overload
DROP FUNCTION IF EXISTS public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT
);

-- Scope-Aware Submission Function
CREATE OR REPLACE FUNCTION public.submit_product_with_rate_limit(
    p_product_name VARCHAR(150),
    p_website_url VARCHAR(500),
    p_tagline VARCHAR(250),
    p_description TEXT,
    p_category_id UUID,
    p_country_built_id UUID,
    p_countries_served_ids UUID[],
    p_pricing_model public.pricing_model_enum,
    p_pricing_details TEXT,
    p_submitter_name VARCHAR(150),
    p_submitter_email VARCHAR(150),
    p_is_founder BOOLEAN,
    p_ip_hash VARCHAR(128),
    p_max_per_hour INT DEFAULT 3,
    p_availability_scope public.availability_scope_enum DEFAULT 'selected_countries'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recent_count INT;
    v_new_id UUID;
    v_clean_domain TEXT;
    v_invalid_served_count INT;
BEGIN
    -- 1. Acquire transaction-level advisory lock on IP hash
    PERFORM pg_advisory_xact_lock(hashtext('ip:' || p_ip_hash));

    -- Rate limit check
    SELECT COUNT(*) INTO v_recent_count
    FROM public.submissions
    WHERE submitted_ip_hash = p_ip_hash
      AND created_at >= NOW() - INTERVAL '1 hour';

    IF v_recent_count >= p_max_per_hour THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Maximum of % submissions per hour allowed per IP address.', p_max_per_hour
            USING ERRCODE = 'P0001';
    END IF;

    -- Extract clean canonical domain
    v_clean_domain := regexp_replace(regexp_replace(lower(p_website_url), '^https?://(www\.)?', ''), '[/?#].*$', '');

    IF v_clean_domain = '' THEN
        RAISE EXCEPTION 'INVALID_DOMAIN: Cannot extract valid domain from URL.' USING ERRCODE = '22023';
    END IF;

    -- 2. Acquire transaction-level advisory lock on domain
    PERFORM pg_advisory_xact_lock(hashtext('domain:' || v_clean_domain));

    -- 3. Taxonomy & Availability Scope Checks
    IF NOT EXISTS (
        SELECT 1 FROM public.categories
        WHERE id = p_category_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'INVALID_CATEGORY: The specified category does not exist or is inactive.'
            USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.countries
        WHERE id = p_country_built_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'INVALID_COUNTRY_BUILT: The specified origin country does not exist or is inactive.'
            USING ERRCODE = '22023';
    END IF;

    -- Scope-Aware Country Validation
    IF p_availability_scope = 'selected_countries' THEN
        IF COALESCE(cardinality(p_countries_served_ids), 0) = 0 THEN
            RAISE EXCEPTION 'INVALID_COUNTRY_SERVED: At least one served country is required when availability scope is selected_countries.'
                USING ERRCODE = '22023';
        END IF;

        SELECT COUNT(*) INTO v_invalid_served_count
        FROM unnest(p_countries_served_ids) AS served_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.countries
            WHERE id = served_id AND is_active = true
        );

        IF v_invalid_served_count > 0 THEN
            RAISE EXCEPTION 'INVALID_COUNTRY_SERVED: % selected served country identifier(s) do not exist or are inactive.', v_invalid_served_count
                USING ERRCODE = '22023';
        END IF;
    ELSE
        -- When global or unverified, served countries may be empty. If provided, validate them.
        IF COALESCE(cardinality(p_countries_served_ids), 0) > 0 THEN
            SELECT COUNT(*) INTO v_invalid_served_count
            FROM unnest(p_countries_served_ids) AS served_id
            WHERE NOT EXISTS (
                SELECT 1 FROM public.countries
                WHERE id = served_id AND is_active = true
            );

            IF v_invalid_served_count > 0 THEN
                RAISE EXCEPTION 'INVALID_COUNTRY_SERVED: % selected served country identifier(s) do not exist or are inactive.', v_invalid_served_count
                    USING ERRCODE = '22023';
            END IF;
        END IF;
    END IF;

    -- 4. Check if domain already exists in products catalogue
    IF EXISTS (
        SELECT 1 FROM public.products
        WHERE regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '[/?#].*$', '') = v_clean_domain
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_DOMAIN: A software listing for domain "%" already exists.', v_clean_domain
            USING ERRCODE = '23505';
    END IF;

    -- 5. Check if domain already has a pending submission in review
    IF EXISTS (
        SELECT 1 FROM public.submissions
        WHERE status = 'pending'
          AND regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '[/?#].*$', '') = v_clean_domain
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_SUBMISSION: A submission for domain "%" is already pending editorial moderation.', v_clean_domain
            USING ERRCODE = '23505';
    END IF;

    -- 6. Insert into submissions
    INSERT INTO public.submissions (
        product_name,
        website_url,
        tagline,
        description,
        category_id,
        country_built_id,
        countries_served_ids,
        pricing_model,
        submitter_name,
        submitter_email,
        is_founder,
        submitted_ip_hash,
        status,
        admin_notes,
        availability_scope
    ) VALUES (
        p_product_name,
        p_website_url,
        p_tagline,
        p_description,
        p_category_id,
        p_country_built_id,
        COALESCE(p_countries_served_ids, '{}'::uuid[]),
        p_pricing_model,
        p_submitter_name,
        p_submitter_email,
        p_is_founder,
        p_ip_hash,
        'pending',
        p_pricing_details,
        p_availability_scope
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- Strict Privilege Lockdown: service_role only
REVOKE ALL ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT,
    public.availability_scope_enum
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT,
    public.availability_scope_enum
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT,
    public.availability_scope_enum
) TO service_role;

-- Apply QuickBridge Editorial Audit Adjustments
UPDATE public.products
SET
    primary_category_id = (SELECT id FROM public.categories WHERE slug = 'productivity-tools'),
    tagline = 'Transfer files and information between devices, directly from your browser.',
    description = 'Move files, photos, links and clipboard content between devices without accounts, cables or native app installations. QuickBridge is a browser-based peer-to-peer transfer tool created by South African developer Clive Makazhu. It uses WebRTC to establish encrypted connections between devices, with a TURN relay available when direct connectivity is not possible.',
    pricing_details = 'Free to use. No subscription or account required. Transfers up to 10 GB with disk auto-save. Advertisements may appear on informational pages.',
    availability_scope = 'global',
    updated_at = NOW()
WHERE slug = 'quickbridge';

-- Remove country-specific served links for QuickBridge (as its scope is now Global)
DELETE FROM public.product_countries_served
WHERE product_id = (SELECT id FROM public.products WHERE slug = 'quickbridge');
