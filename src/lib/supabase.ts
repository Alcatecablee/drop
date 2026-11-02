import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_COUNTRIES,
  DEFAULT_CATEGORIES,
  INITIAL_CANDIDATE_PRODUCTS,
  INITIAL_EDITORIAL_RESOURCES,
} from './constants'
import type { Country, Category, ProductWithRelations, EditorialResource, Submission } from './types'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// Initialize client if credentials exist
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Data fetcher for published products (with local fallback if Supabase not configured)
 */
export async function getPublishedProducts(): Promise<ProductWithRelations[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('public_products')
        .select(`
          *,
          country_built:countries!country_built_id(*),
          primary_category:categories!primary_category_id(*),
          product_countries_served(country:countries(*))
        `)
        .order('published_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          countries_served: item.product_countries_served
            ?.map((pcs: any) => pcs.country)
            .filter(Boolean) || [],
        }))
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local dataset:', e)
    }
  }

  // Local fallback: return published products from INITIAL_CANDIDATE_PRODUCTS
  return INITIAL_CANDIDATE_PRODUCTS.filter((p) => p.publication_status === 'published')
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('public_products')
        .select(`
          *,
          country_built:countries!country_built_id(*),
          primary_category:categories!primary_category_id(*),
          product_countries_served(country:countries(*))
        `)
        .eq('slug', slug)
        .maybeSingle()

      if (!error && data) {
        return {
          ...data,
          countries_served: data.product_countries_served
            ?.map((pcs: any) => pcs.country)
            .filter(Boolean) || [],
        }
      }
    } catch (e) {
      console.warn('Supabase product query failed, using local fallback:', e)
    }
  }

  const found = INITIAL_CANDIDATE_PRODUCTS.find(
    (p) => p.slug === slug && p.publication_status === 'published'
  )
  return found || null
}

export async function getActiveCountries(): Promise<Country[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase countries query failed:', e)
    }
  }
  return DEFAULT_COUNTRIES.filter((c) => c.is_active)
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const countries = await getActiveCountries()
  return countries.find((c) => c.slug === slug) || null
}

export async function getCategories(): Promise<Category[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase categories query failed:', e)
    }
  }
  return DEFAULT_CATEGORIES
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories()
  return categories.find((c) => c.slug === slug) || null
}

export async function getPublishedResources(): Promise<EditorialResource[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('publication_status', 'published')
        .order('published_at', { ascending: false })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase resources query failed:', e)
    }
  }
  return INITIAL_EDITORIAL_RESOURCES.filter((r) => r.publication_status === 'published')
}

export async function getResourceBySlug(slug: string): Promise<EditorialResource | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('slug', slug)
        .eq('publication_status', 'published')
        .maybeSingle()

      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase resource query failed:', e)
    }
  }
  return INITIAL_EDITORIAL_RESOURCES.find((r) => r.slug === slug && r.publication_status === 'published') || null
}
