-- Migration 3: Submission Security Hardening
-- 1. Restrict submit_product_with_rate_limit execution exclusively to service_role (revoke from PUBLIC, anon, authenticated)
-- 2. Add advisory transaction lock on domain (pg_advisory_xact_lock on 'domain:' || v_clean_domain) to eliminate race conditions
-- 3. Add partial unique index on pending submissions by domain to guarantee at-most-one pending submission per domain

-- Update submit_product_with_rate_limit function
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
    p_max_per_hour INT DEFAULT 3
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
BEGIN
    -- 1. Acquire transaction-level advisory lock on IP hash to prevent concurrent IP spam race conditions
    PERFORM pg_advisory_xact_lock(hashtext('ip:' || p_ip_hash));

    -- Rate limit check: max submissions per hour for this IP hash
    SELECT COUNT(*) INTO v_recent_count
    FROM public.submissions
    WHERE submitted_ip_hash = p_ip_hash
      AND created_at >= NOW() - INTERVAL '1 hour';

    IF v_recent_count >= p_max_per_hour THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Maximum of % submissions per hour allowed per IP address.', p_max_per_hour
            USING ERRCODE = 'P0001';
    END IF;

    -- Extract clean domain for duplicate checks
    v_clean_domain := regexp_replace(regexp_replace(lower(p_website_url), '^https?://(www\.)?', ''), '/.*$', '');

    IF v_clean_domain = '' THEN
        RAISE EXCEPTION 'INVALID_DOMAIN: Cannot extract valid domain from URL.' USING ERRCODE = '22023';
    END IF;

    -- 2. Acquire transaction-level advisory lock on domain to prevent concurrent domain submission races across multiple IPs
    PERFORM pg_advisory_xact_lock(hashtext('domain:' || v_clean_domain));

    -- Check if domain already exists in products catalogue
    IF EXISTS (
        SELECT 1 FROM public.products
        WHERE regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '/.*$', '') = v_clean_domain
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_DOMAIN: A software listing for domain "%" already exists.', v_clean_domain
            USING ERRCODE = '23505';
    END IF;

    -- Check if domain already has a pending submission in review
    IF EXISTS (
        SELECT 1 FROM public.submissions
        WHERE status = 'pending'
          AND regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '/.*$', '') = v_clean_domain
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_SUBMISSION: A submission for domain "%" is already pending editorial moderation.', v_clean_domain
            USING ERRCODE = '23505';
    END IF;

    -- Insert into submissions
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
        admin_notes
    ) VALUES (
        p_product_name,
        p_website_url,
        p_tagline,
        p_description,
        p_category_id,
        p_country_built_id,
        p_countries_served_ids,
        p_pricing_model,
        p_submitter_name,
        p_submitter_email,
        p_is_founder,
        p_ip_hash,
        'pending',
        p_pricing_details
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- Strict Column and RPC Privilege Lockdown
REVOKE ALL ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_product_with_rate_limit(
    VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID[],
    public.pricing_model_enum, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INT
) TO service_role;

-- Partial unique index on pending submissions to eliminate race condition duplicates at the storage level
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_pending_clean_domain
ON public.submissions (regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '/.*$', ''))
WHERE status = 'pending';
