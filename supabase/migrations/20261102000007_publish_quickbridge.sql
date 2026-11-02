-- Migration 7: Publish QuickBridge as First Verified Listing
-- Post-audit editorial verification completed:
-- 1. Category: Productivity & Creative Tools
-- 2. Availability Scope: Global Web Service
-- 3. Commercial Pricing: Free (10 GB disk auto-save, informational ad disclosures)
-- 4. Architecture: WebRTC peer-to-peer data channels with TURN relay fallback

UPDATE public.products
SET
    publication_status = 'published',
    verification_status = 'verified',
    published_at = NOW(),
    last_verified_at = NOW(),
    updated_at = NOW()
WHERE slug = 'quickbridge';
