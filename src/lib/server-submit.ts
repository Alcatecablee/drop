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
  company_fax?: string // Honeypot field
  turnstile_token?: string
}

export interface SubmitProductResult {
  success: boolean
  message: string
  submissionId?: string
}

// In-memory rate limiting cache for server instances
const rateLimitCache = new Map<string, number[]>()

function isRateLimited(ipHash: string, limit = 3, windowMs = 3600000): boolean {
  const now = Date.now()
  const timestamps = rateLimitCache.get(ipHash) || []
  const validTimestamps = timestamps.filter((t) => now - t < windowMs)

  if (validTimestamps.length >= limit) {
    return true
  }

  validTimestamps.push(now)
  rateLimitCache.set(ipHash, validTimestamps)
  return false
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

export const submitProductServerFn = createServerFn({ method: 'POST' })
  .validator((data: SubmitProductInput) => data)
  .handler(async ({ data }): Promise<SubmitProductResult> => {
    // 1. Anti-Bot Honeypot Check
    if (data.company_fax && data.company_fax.trim().length > 0) {
      console.warn('Bot detected via honeypot (company_fax filled). Silently discarding.')
      return {
        success: true,
        message: 'Your software submission has been received for editorial review.',
      }
    }

    // 2. Client IP Resolution & Hashing
    let clientIp = '127.0.0.1'
    try {
      const ip = getRequestIP()
      if (ip) {
        clientIp = ip
      } else {
        const headers = getRequestHeaders()
        const forwarded = headers['x-forwarded-for'] || headers['x-real-ip']
        if (forwarded) {
          clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()
        }
      }
    } catch {
      // Fallback
    }

    const salt = process.env.IP_HASH_SALT || 'dropyoursaas_default_salt_2026'
    const ipHash = crypto.createHash('sha256').update(`${clientIp}-${salt}`).digest('hex')

    // 3. IP Rate Limiting Check (Max 3 submissions per hour per IP)
    if (isRateLimited(ipHash, 3, 3600000)) {
      throw new Error('Rate limit exceeded: You have submitted multiple tools recently. Please wait an hour before submitting again.')
    }

    // 4. URL Validation & Normalization
    let normalizedUrl = data.website_url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Enforce HTTPS
    if (normalizedUrl.startsWith('http://')) {
      normalizedUrl = normalizedUrl.replace('http://', 'https://')
    }

    const domain = extractDomain(normalizedUrl)
    if (!domain || !domain.includes('.')) {
      throw new Error('Invalid website URL. Please provide a valid domain with a supported TLD.')
    }

    // 5. Cloudflare Turnstile Verification (if secret configured)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret && data.turnstile_token) {
      try {
        const formData = new URLSearchParams()
        formData.append('secret', turnstileSecret)
        formData.append('response', data.turnstile_token)
        formData.append('remoteip', clientIp)

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
        })
        const result = (await res.json()) as { success: boolean }
        if (!result.success) {
          throw new Error('Bot verification check failed. Please refresh and try again.')
        }
      } catch (err: any) {
        throw new Error(err.message || 'Turnstile verification failed.')
      }
    }

    // 6. Duplicate Domain Check
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey) {
      const serverSupabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      })

      // Check existing products for duplicate domain
      const { data: existingProduct } = await serverSupabase
        .from('products')
        .select('name, website_url')
        .ilike('website_url', `%${domain}%`)
        .maybeSingle()

      if (existingProduct) {
        throw new Error(
          `A software product listing for domain "${domain}" already exists ("${existingProduct.name}"). Duplicate listings are not permitted.`
        )
      }

      // Check pending submissions for duplicate domain
      const { data: existingSubmission } = await serverSupabase
        .from('submissions')
        .select('name, website_url, submission_status')
        .ilike('website_url', `%${domain}%`)
        .eq('submission_status', 'pending')
        .maybeSingle()

      if (existingSubmission) {
        throw new Error(
          `A submission for domain "${domain}" is already pending editorial moderation. Our team reviews submissions in the order received.`
        )
      }

      // 7. Server-Only Database Insertion
      const { data: inserted, error: insertError } = await serverSupabase
        .from('submissions')
        .insert({
          name: data.name.trim(),
          website_url: normalizedUrl,
          tagline: data.tagline.trim(),
          description: data.description.trim(),
          category_id: data.category_id,
          country_built_id: data.country_built_id,
          countries_served_ids: data.countries_served_ids,
          pricing_model: data.pricing_model,
          pricing_details: data.pricing_details?.trim() || null,
          submitter_name: data.submitter_name.trim(),
          submitter_email: data.submitter_email.trim(),
          submitter_relationship: data.submitter_relationship,
          submission_status: 'pending',
          ip_hash: ipHash,
        })
        .select('id')
        .single()

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`)
      }

      return {
        success: true,
        message: 'Your software submission has been received for editorial review.',
        submissionId: inserted.id,
      }
    } else {
      // Offline / Local Development Fallback:
      // Check local candidate dataset for duplicate domain
      const existsInLocal = INITIAL_CANDIDATE_PRODUCTS.some(
        (p) => extractDomain(p.website_url) === domain
      )
      if (existsInLocal) {
        throw new Error(
          `A software candidate for domain "${domain}" is already staged in the candidate catalogue.`
        )
      }

      console.info('[Server Submission] Validated submission in local offline mode:', {
        name: data.name,
        domain,
        ipHash: ipHash.substring(0, 8) + '...',
      })

      return {
        success: true,
        message: 'Submission validated and staged in local preview mode.',
      }
    }
  })
