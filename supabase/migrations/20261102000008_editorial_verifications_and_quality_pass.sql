-- Migration 8: Editorial Verification Audit Trail & Listing Quality Pass
-- 1. Create public.editorial_verifications table for structured audit evidence
-- 2. Grant SELECT privileges to anon and authenticated
-- 3. Insert structured verification record for QuickBridge (first verified listing)
-- 4. Update QuickBridge copy with precise privacy and advertising wording
-- 5. Set remaining 19 unverified candidate products to availability_scope = 'unverified'

CREATE TABLE IF NOT EXISTS public.editorial_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(150) NOT NULL,
    verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
    official_website VARCHAR(500) NOT NULL,
    builder_evidence TEXT NOT NULL,
    pricing_evidence TEXT NOT NULL,
    availability_evidence TEXT NOT NULL,
    functionality_notes TEXT NOT NULL,
    test_performed TEXT NOT NULL,
    limitations TEXT NOT NULL,
    publisher_relationship TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_editorial_verifications_product_id
ON public.editorial_verifications(product_id);

GRANT SELECT ON public.editorial_verifications TO anon, authenticated;

-- Insert structured verification record for QuickBridge
INSERT INTO public.editorial_verifications (
    product_id,
    reviewer_name,
    verification_date,
    official_website,
    builder_evidence,
    pricing_evidence,
    availability_evidence,
    functionality_notes,
    test_performed,
    limitations,
    publisher_relationship
) VALUES (
    (SELECT id FROM public.products WHERE slug = 'quickbridge'),
    'Clive Makazhu',
    '2026-11-03',
    'https://quickbridge.app',
    'justc.live (verified developer portfolio and personal domain attribution)',
    'Official pricing and FAQ: Free to use, no subscription or account required. Transfers up to 10 GB with disk auto-save. No advertisements in the core transfer experience; ads may appear on informational pages.',
    'Global web service: Browser-native WebRTC peer-to-peer data channels with automatic TURN relay fallback. Globally accessible without regional geoblocking.',
    'Browser-native peer-to-peer data and file transfer utility for direct, encrypted transmission between devices without accounts, cables, or installations.',
    'First-party HTTPS website walkthrough, product interface verification, WebRTC connection protocol documentation review.',
    'No independent third-party security or cryptographic audit conducted by OriginIndex.',
    'Publisher affiliated: QuickBridge is developed by Clive Makazhu, the operator of OriginIndex.'
);

-- Update QuickBridge with accurate marketing and privacy copy
UPDATE public.products
SET
    description = 'Move files, photos, links and clipboard content between devices without accounts, cables or native app installations. QuickBridge is a browser-based peer-to-peer transfer tool created by South African developer Clive Makazhu. It uses WebRTC to establish encrypted connections between devices, with a TURN relay available when direct connectivity is not possible. No cloud file storage is used; transferred content travels directly between connected devices.',
    pricing_details = 'Free to use. No subscription or account required. Transfers up to 10 GB with disk auto-save. No advertisements in the core transfer experience; ads may appear on informational pages.',
    updated_at = NOW()
WHERE slug = 'quickbridge';

-- Set remaining 19 unreviewed candidates to availability_scope = 'unverified'
-- (Selected countries should only be assigned after an active market audit)
UPDATE public.products
SET availability_scope = 'unverified', updated_at = NOW()
WHERE slug != 'quickbridge' AND publication_status = 'draft';
