import { createServerFn } from '@tanstack/react-start'
import { getRequestIP, getRequestHeaders } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import type { PricingModel } from './types'
import { INITIAL_CANDIDATE_PRODUCTS } from './constants'

export interface SubmitProductInput {
  name: string
  website_url: string
  tagline: string
  description: string
  category_id: string
  country_built_id: string
  countries_served_ids: string[]
  pricing_model: PricingModel
  pricing_details?: string
  submitter_name: string
  submitter_email: string
  submitter_relationship: string
  company_fax?: string // Honeypot trap
  turnstile_token?: string
}

export interface SubmitProductResult {
  success: boolean
  message: string
  submissionId?: string
}

// Development fallback rate limiting map (only used when running offline without Supabase)
const devRateLimitMap = new Map<string, number[]>()

function checkDevRateLimit(ipHash: string, limit = 3, windowMs = 3600000): boolean {
  const now = Date.now()
  const timestamps = (devRateLimitMap.get(ipHash) || []).filter((t) => now - t < windowMs)
  if (timestamps.length >= limit) return true
  timestamps.push(now)
  devRateLimitMap.set(ipHash, timestamps)
  return false
}

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$/

function resolveClientIp(headers: Record<string, string | undefined>, serverIp?: string): string {
  // In production behind Cloudflare, CF-Connecting-IP is set by the edge proxy
  const cfIp = headers['cf-connecting-ip']
  if (cfIp && (IPV4_REGEX.test(cfIp.trim()) || IPV6_REGEX.test(cfIp.trim()))) {
    return cfIp.trim()
  }

  // Trusted proxy real-ip
  const realIp = headers['x-real-ip']
  if (realIp && (IPV4_REGEX.test(realIp.trim()) || IPV6_REGEX.test(realIp.trim()))) {
    return realIp.trim()
  }

  // Forwarded-for (use leftmost client IP)
  const forwarded = headers['x-forwarded-for']
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim()
    if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
      return candidate
    }
  }

  if (serverIp && (IPV4_REGEX.test(serverIp.trim()) || IPV6_REGEX.test(serverIp.trim()))) {
    return serverIp.trim()
  }

  return '127.0.0.1'
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
const VALID_PRICING_MODELS = new Set<PricingModel>([
  'free',
  'freemium',
  'free_trial',
  'paid_subscription',
  'usage_based',
  'contact_for_pricing',
])
const VALID_RELATIONSHIPS = new Set([
  'founder',
  'team_member',
  'user',
  'community',
])

export function validateSubmitProductInput(input: unknown): SubmitProductInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request payload. Expected JSON object.')
  }

  const raw = input as Record<string, unknown>

  // 1. Name
  if (typeof raw.name !== 'string' || raw.name.trim().length < 2 || raw.name.trim().length > 100) {
    throw new Error('Product name must be between 2 and 100 characters.')
  }

  // 2. Website URL
  if (typeof raw.website_url !== 'string' || raw.website_url.trim().length < 4 || raw.website_url.trim().length > 500) {
    throw new Error('Website URL must be between 4 and 500 characters.')
  }

  let normalizedUrl = raw.website_url.trim()
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`
  }
  if (normalizedUrl.startsWith('http://')) {
    normalizedUrl = normalizedUrl.replace('http://', 'https://')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    throw new Error('Invalid website URL format.')
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Website URL must use secure HTTPS protocol.')
  }

  const domain = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
  if (!domain || !domain.includes('.') || domain.endsWith('.')) {
    throw new Error('Website URL must include a valid top-level domain.')
  }

  // 3. Tagline
  if (typeof raw.tagline !== 'string' || raw.tagline.trim().length < 10 || raw.tagline.trim().length > 150) {
    throw new Error('Tagline must be between 10 and 150 characters.')
  }

  // 4. Description
  if (typeof raw.description !== 'string' || raw.description.trim().length < 20 || raw.description.trim().length > 5000) {
    throw new Error('Description must be between 20 and 5000 characters.')
  }

  // 5. Category ID (UUID)
  if (typeof raw.category_id !== 'string' || !UUID_REGEX.test(raw.category_id.trim())) {
    throw new Error('Invalid category identifier. Must be a valid UUID.')
  }

  // 6. Country Built ID (UUID)
  if (typeof raw.country_built_id !== 'string' || !UUID_REGEX.test(raw.country_built_id.trim())) {
    throw new Error('Invalid country of origin identifier. Must be a valid UUID.')
  }

  // 7. Countries Served IDs (Array of UUIDs, min 1)
  if (!Array.isArray(raw.countries_served_ids) || raw.countries_served_ids.length === 0) {
    throw new Error('At least one country served must be selected.')
  }
  if (raw.countries_served_ids.length > 54) {
    throw new Error('Countries served cannot exceed 54 African countries.')
  }
  for (const cid of raw.countries_served_ids) {
    if (typeof cid !== 'string' || !UUID_REGEX.test(cid.trim())) {
      throw new Error(`Invalid country identifier in countries served: "${cid}".`)
    }
  }

  // 8. Pricing Model
  if (typeof raw.pricing_model !== 'string' || !VALID_PRICING_MODELS.has(raw.pricing_model as PricingModel)) {
    throw new Error(`Invalid pricing model: "${raw.pricing_model}".`)
  }

  // 9. Pricing Details (optional)
  let cleanPricingDetails: string | undefined
  if (raw.pricing_details !== undefined && raw.pricing_details !== null && raw.pricing_details !== '') {
    if (typeof raw.pricing_details !== 'string') {
      throw new Error('Pricing details must be a string.')
    }
    if (raw.pricing_details.trim().length > 500) {
      throw new Error('Pricing details cannot exceed 500 characters.')
    }
    cleanPricingDetails = raw.pricing_details.trim() || undefined
  }

  // 10. Submitter Name
  if (typeof raw.submitter_name !== 'string' || raw.submitter_name.trim().length < 2 || raw.submitter_name.trim().length > 100) {
    throw new Error('Submitter name must be between 2 and 100 characters.')
  }

  // 11. Submitter Email
  if (
    typeof raw.submitter_email !== 'string' ||
    raw.submitter_email.trim().length > 150 ||
    !EMAIL_REGEX.test(raw.submitter_email.trim())
  ) {
    throw new Error('Please provide a valid submitter email address.')
  }

  // 12. Submitter Relationship
  if (typeof raw.submitter_relationship !== 'string' || !VALID_RELATIONSHIPS.has(raw.submitter_relationship.trim())) {
    throw new Error('Invalid submitter relationship specified.')
  }

  // 13. Honeypot field (company_fax)
  let cleanCompanyFax: string | undefined
  if (typeof raw.company_fax === 'string') {
    cleanCompanyFax = raw.company_fax.substring(0, 200)
  }

  // 14. Turnstile token
  let cleanTurnstileToken: string | undefined
  if (typeof raw.turnstile_token === 'string') {
    cleanTurnstileToken = raw.turnstile_token.trim().substring(0, 2048)
  }

  return {
    name: raw.name.trim(),
    website_url: normalizedUrl,
    tagline: raw.tagline.trim(),
    description: raw.description.trim(),
    category_id: raw.category_id.trim(),
    country_built_id: raw.country_built_id.trim(),
    countries_served_ids: raw.countries_served_ids.map((id) => (id as string).trim()),
    pricing_model: raw.pricing_model as PricingModel,
    pricing_details: cleanPricingDetails,
    submitter_name: raw.submitter_name.trim(),
    submitter_email: raw.submitter_email.trim().toLowerCase(),
    submitter_relationship: raw.submitter_relationship.trim(),
    company_fax: cleanCompanyFax,
    turnstile_token: cleanTurnstileToken,
  }
}

export const submitProductServerFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): SubmitProductInput => validateSubmitProductInput(data))
  .handler(async ({ data }): Promise<SubmitProductResult> => {
    const isProduction = process.env.NODE_ENV === 'production'

    // 1. Anti-Bot Honeypot Check (Silently discard automated spam submissions)
    if (data.company_fax && data.company_fax.trim().length > 0) {
      console.warn('[Anti-Spam] Bot submission discarded via honeypot trap.')
      return {
        success: true,
        message: 'Your software submission has been received for editorial review.',
      }
    }

    // 2. Mandatory Cloudflare Turnstile Bot Verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    const allowDevBypass = !isProduction && process.env.ALLOW_DEV_TURNSTILE_BYPASS === 'true'

    if (!turnstileSecret) {
      if (isProduction) {
        console.error('[Security] TURNSTILE_SECRET_KEY is missing in production environment.')
        throw new Error('Submission service configuration error. Please contact editorial support.')
      } else if (!allowDevBypass) {
        throw new Error(
          'Turnstile secret is not configured in local environment. Set TURNSTILE_SECRET_KEY or set ALLOW_DEV_TURNSTILE_BYPASS=true for testing.'
        )
      } else {
        console.warn('[Security] Development Turnstile bypass active (ALLOW_DEV_TURNSTILE_BYPASS=true).')
      }
    } else {
      // Secret is present: token is strictly required
      const token = data.turnstile_token?.trim()
      if (!token) {
        throw new Error('Bot verification token is required to submit software.')
      }

      try {
        const formData = new URLSearchParams()
        formData.append('secret', turnstileSecret)
        formData.append('response', token)

        // 5-second timeout to prevent hung verification connections
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Turnstile verification server returned status ${res.status}.`)
        }

        const verifyResult = (await res.json()) as { success: boolean; 'error-codes'?: string[] }
        if (!verifyResult.success) {
          console.warn('[Security] Turnstile token verification failed.')
          throw new Error('Bot verification challenge failed. Please reload the page and try again.')
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Bot verification timed out. Please try again.')
        }
        throw new Error(err.message || 'Bot verification failed.')
      }
    }

    // 3. Client IP Resolution & Secure HMAC Hashing
    let rawHeaders: Record<string, string | undefined> = {}
    try {
      rawHeaders = (getRequestHeaders() as unknown as Record<string, string | undefined>) || {}
    } catch {
      // Fallback
    }

    let requestIp: string | undefined
    try {
      requestIp = getRequestIP()
    } catch {
      // Fallback
    }

    const clientIp = resolveClientIp(rawHeaders, requestIp)

    const salt = process.env.IP_HASH_SALT
    if (isProduction && (!salt || salt === 'dropyoursaas_default_salt_2026')) {
      console.error('[Security] Production IP_HASH_SALT must be configured and cannot use default value.')
      throw new Error('Server configuration error. Submission pipeline halted.')
    }

    const effectiveSalt = salt || 'dropyoursaas_dev_salt_local'
    const ipHash = crypto.createHmac('sha256', effectiveSalt).update(clientIp).digest('hex')

    // 4. URL Validation & HTTPS Normalization
    let normalizedUrl = data.website_url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    if (normalizedUrl.startsWith('http://')) {
      normalizedUrl = normalizedUrl.replace('http://', 'https://')
    }

    const domain = extractDomain(normalizedUrl)
    if (!domain || !domain.includes('.')) {
      throw new Error('Invalid website URL. Please provide an active domain.')
    }

    // 5. Database Insertion & Atomic Distributed Rate Limiting
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey) {
      const serverSupabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      })

      // Call database procedure with transaction-level advisory locking
      const { data: submissionId, error: rpcError } = await serverSupabase.rpc(
        'submit_product_with_rate_limit',
        {
          p_product_name: data.name.trim(),
          p_website_url: normalizedUrl,
          p_tagline: data.tagline.trim(),
          p_description: data.description.trim(),
          p_category_id: data.category_id,
          p_country_built_id: data.country_built_id,
          p_countries_served_ids: data.countries_served_ids,
          p_pricing_model: data.pricing_model,
          p_pricing_details: data.pricing_details?.trim() || null,
          p_submitter_name: data.submitter_name.trim(),
          p_submitter_email: data.submitter_email.trim(),
          p_is_founder: data.submitter_relationship === 'founder',
          p_ip_hash: ipHash,
          p_max_per_hour: 3,
        }
      )

      if (rpcError) {
        if (rpcError.message.includes('RATE_LIMIT_EXCEEDED')) {
          throw new Error('Rate limit exceeded: A maximum of 3 submissions per hour is permitted per IP address.')
        }
        if (rpcError.message.includes('DUPLICATE_DOMAIN')) {
          throw new Error(`A software product listing for domain "${domain}" already exists in the catalogue.`)
        }
        if (rpcError.message.includes('DUPLICATE_SUBMISSION')) {
          throw new Error(`A submission for domain "${domain}" is currently pending editorial review.`)
        }
        console.error('[Submission DB Error]', rpcError.message)
        throw new Error('An error occurred recording your submission. Please try again later.')
      }

      return {
        success: true,
        message: 'Your software submission has been received for editorial review.',
        submissionId: submissionId as string,
      }
    } else {
      // Local Development Offline Mode
      if (isProduction) {
        throw new Error('Database service is not configured.')
      }

      if (checkDevRateLimit(ipHash, 3, 3600000)) {
        throw new Error('Rate limit exceeded: A maximum of 3 submissions per hour is permitted per IP address.')
      }

      const duplicateLocal = INITIAL_CANDIDATE_PRODUCTS.some(
        (p) => extractDomain(p.website_url) === domain
      )
      if (duplicateLocal) {
        throw new Error(`A software candidate for domain "${domain}" is already staged in the candidate catalogue.`)
      }

      console.info('[Submission Local Dev] Accepted:', {
        name: data.name,
        domain,
        ipHashPrefix: ipHash.substring(0, 8),
      })

      return {
        success: true,
        message: 'Submission validated and recorded in local development mode.',
      }
    }
  })
