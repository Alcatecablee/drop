export type PublicationStatus = 'draft' | 'published' | 'archived'
export type VerificationStatus = 'unverified' | 'community_submitted' | 'verified'
export type OperationalStatus = 'active' | 'beta' | 'discontinued'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'spam'
export type AvailabilityScope = 'global' | 'selected_countries' | 'unverified'
export type AppRole = 'admin'

export type PricingModel =
  | 'free'
  | 'freemium'
  | 'free_trial'
  | 'paid_subscription'
  | 'usage_based'
  | 'contact_for_pricing'

export interface Country {
  id: string
  name: string
  slug: string
  iso_code_2: string
  currency_code: string
  flag_emoji?: string | null
  meta_title?: string | null
  meta_description?: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  meta_title?: string | null
  meta_description?: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  website_url: string
  logo_url?: string | null
  screenshot_url?: string | null
  primary_category_id: string
  country_built_id: string

  builder_name?: string | null
  builder_url?: string | null
  builder_twitter?: string | null
  builder_linkedin?: string | null
  is_founder_submitted: boolean
  publisher_affiliation: boolean
  publisher_affiliation_details?: string | null

  pricing_model: PricingModel
  starting_price_display?: string | null
  pricing_details?: string | null
  supported_payment_gateways: string[]

  platform_type?: string | null
  is_open_source: boolean
  github_url?: string | null

  publication_status: PublicationStatus
  verification_status: VerificationStatus
  operational_status: OperationalStatus
  availability_scope: AvailabilityScope

  // Internal staff fields (omitted in public_products)
  verified_by?: string | null
  verification_notes?: string | null
  verification_evidence_url?: string | null
  last_verified_at?: string | null

  meta_title?: string | null
  meta_description?: string | null

  published_at?: string | null
  created_at: string
  updated_at: string
}

export interface ProductCountryServed {
  product_id: string
  country_id: string
  created_at?: string
  country?: Country
}

export interface ProductWithRelations extends Product {
  country_built?: Country
  primary_category?: Category
  countries_served?: Country[]
  verification_record?: EditorialVerification | null
}

export type ResourceCategory =
  | 'Buyer Guides'
  | 'Technology Explainers'
  | 'African Software Landscape'
  | 'Research & Reports'

export interface EditorialResourceCitation {
  title: string
  url?: string
  publisher?: string
  date?: string
}

export interface EditorialVerification {
  id: string
  product_id: string
  reviewer_name: string
  verification_date: string
  official_website: string
  builder_evidence: string
  pricing_evidence: string
  availability_evidence: string
  functionality_notes: string
  test_performed: string
  limitations: string
  publisher_relationship?: string | null
  is_approved: boolean
  observed_findings?: string | null
  builder_supplied_evidence?: string | null
  untested_boundaries?: string | null
  created_at: string
}

export interface Submission {
  id: string
  product_name: string
  website_url: string
  tagline: string
  description: string
  country_built_id?: string | null
  countries_served_ids: string[]
  category_id?: string | null
  pricing_model?: PricingModel | null
  availability_scope?: AvailabilityScope

  submitter_name: string
  submitter_email: string
  is_founder: boolean

  status: SubmissionStatus
  admin_notes?: string | null
  submitted_ip_hash?: string | null
  created_at: string
  updated_at: string
}

export interface EditorialResource {
  id: string
  title: string
  slug: string
  category: ResourceCategory
  reading_time_minutes: number
  excerpt: string
  content_markdown: string
  cover_image_url?: string | null
  author_name: string
  author_role?: string | null
  reviewer_name?: string | null
  last_reviewed_at?: string | null
  citations?: EditorialResourceCitation[]
  publication_status: PublicationStatus
  meta_title?: string | null
  meta_description?: string | null
  published_at?: string | null
  created_at: string
  updated_at: string
}
