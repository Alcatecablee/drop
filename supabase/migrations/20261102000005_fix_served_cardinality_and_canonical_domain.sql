-- Migration 5: Fix empty served-country cardinality check & canonical domain query/hash stripping
-- 1. Use COALESCE(cardinality(p_countries_served_ids), 0) = 0 so empty arrays are properly caught
-- 2. Strip query strings ('?') and URL fragments ('#') in addition to paths ('/') when deriving clean domain
-- 3. Update partial unique index on submissions for consistency

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
    v_invalid_served_count INT;
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

    -- Extract clean canonical domain (stripping protocol, www., paths, queries, and hash fragments)
    v_clean_domain := regexp_replace(regexp_replace(lower(p_website_url), '^https?://(www\.)?', ''), '[/?#].*$', '');

    IF v_clean_domain = '' THEN
        RAISE EXCEPTION 'INVALID_DOMAIN: Cannot extract valid domain from URL.' USING ERRCODE = '22023';
    END IF;

    -- 2. Acquire transaction-level advisory lock on domain to prevent concurrent domain submission races across multiple IPs
    PERFORM pg_advisory_xact_lock(hashtext('domain:' || v_clean_domain));

    -- 3. Taxonomy Active Status & Existence Checks
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

    -- Empty array check using cardinality() which correctly handles empty {} arrays (unlike array_length which returns NULL)
    IF COALESCE(cardinality(p_countries_served_ids), 0) = 0 THEN
        RAISE EXCEPTION 'INVALID_COUNTRY_SERVED: At least one served country is required.'
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

-- Update partial unique index on pending submissions to strip queries and fragments consistently
DROP INDEX IF EXISTS public.idx_submissions_pending_clean_domain;

CREATE UNIQUE INDEX idx_submissions_pending_clean_domain
ON public.submissions (regexp_replace(regexp_replace(lower(website_url), '^https?://(www\.)?', ''), '[/?#].*$', ''))
WHERE status = 'pending';
