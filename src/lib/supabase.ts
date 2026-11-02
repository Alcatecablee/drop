import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_COUNTRIES,
  DEFAULT_CATEGORIES,
  INITIAL_CANDIDATE_PRODUCTS,
  INITIAL_EDITORIAL_RESOURCES,
} from './constants'
import type { Country, Category, ProductWithRelations, EditorialResource } from './types'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export const isProduction = process.env.NODE_ENV === 'production'

// Initialize client if credentials exist
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Data fetcher for published products.
 * In production:
 * - When Supabase is configured, successful empty results return [] (never fallback).
 * - When Supabase returns an error, throws an explicit exception (never silent fallback).
 * In development:
 * - If Supabase is unconfigured, permits reading local staged candidates strictly filtered by publication_status.
 */
export async function getPublishedProducts(): Promise<ProductWithRelations[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('public_products')
      .select(`
        *,
        country_built:countries!country_built_id(*),
        primary_category:categories!primary_category_id(*),
        product_countries_served(country:countries(*))
      `)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('[Supabase Error] getPublishedProducts failed:', error.message)
      throw new Error(`Database error retrieving published products: ${error.message}`)
    }

    if (data) {
      return data.map((item: any) => ({
        ...item,
        countries_served: item.product_countries_served
          ?.map((pcs: any) => pcs.country)
          .filter(Boolean) || [],
      }))
    }
  }

  // Development-only fallback when Supabase credentials are not configured
  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  // Strictly filter by publication_status === 'published' (drafts are NEVER returned)
  return INITIAL_CANDIDATE_PRODUCTS.filter((p) => p.publication_status === 'published')
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  if (supabase) {
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

    if (error) {
      console.error('[Supabase Error] getProductBySlug failed:', error.message)
      throw new Error(`Database error retrieving product "${slug}": ${error.message}`)
    }

    if (data) {
      return {
        ...data,
        countries_served: data.product_countries_served
          ?.map((pcs: any) => pcs.country)
          .filter(Boolean) || [],
      }
    }

    // Not found in public_products (is draft, archived, or does not exist)
    return null
  }

  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  const found = INITIAL_CANDIDATE_PRODUCTS.find(
    (p) => p.slug === slug && p.publication_status === 'published'
  )
  return found || null
}

export async function getActiveCountries(): Promise<Country[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Supabase Error] getActiveCountries failed:', error.message)
      throw new Error(`Database error retrieving active countries: ${error.message}`)
    }

    if (data) return data
  }

  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  return DEFAULT_COUNTRIES.filter((c) => c.is_active)
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const countries = await getActiveCountries()
  return countries.find((c) => c.slug === slug) || null
}

export async function getCategories(): Promise<Category[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Supabase Error] getCategories failed:', error.message)
      throw new Error(`Database error retrieving categories: ${error.message}`)
    }

    if (data) return data
  }

  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  return DEFAULT_CATEGORIES.filter((c) => c.is_active)
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories()
  return categories.find((c) => c.slug === slug) || null
}

export async function getPublishedResources(): Promise<EditorialResource[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('publication_status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('[Supabase Error] getPublishedResources failed:', error.message)
      throw new Error(`Database error retrieving published resources: ${error.message}`)
    }

    if (data) return data
  }

  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  return INITIAL_EDITORIAL_RESOURCES.filter((r) => r.publication_status === 'published')
}

export async function getResourceBySlug(slug: string): Promise<EditorialResource | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('slug', slug)
      .eq('publication_status', 'published')
      .maybeSingle()

    if (error) {
      console.error('[Supabase Error] getResourceBySlug failed:', error.message)
      throw new Error(`Database error retrieving resource "${slug}": ${error.message}`)
    }

    return data || null
  }

  if (isProduction) {
    throw new Error('Supabase client is not configured in production environment.')
  }

  return (
    INITIAL_EDITORIAL_RESOURCES.find(
      (r) => r.slug === slug && r.publication_status === 'published'
    ) || null
  )
}
