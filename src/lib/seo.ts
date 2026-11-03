import type { ProductWithRelations, EditorialResource } from './types'

export function buildProductJsonLd(product: ProductWithRelations, canonicalUrl: string) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    url: canonicalUrl,
    sameAs: product.website_url,
    description: product.description,
    applicationCategory: product.primary_category?.name || 'BusinessApplication',
    operatingSystem: product.platform_type || 'Web Browser',
  }

  // Map country of origin
  if (product.country_built) {
    jsonLd.countryOfOrigin = {
      '@type': 'Country',
      name: product.country_built.name,
    }
  }

  // Map area served
  if (product.countries_served && product.countries_served.length > 0) {
    jsonLd.areaServed = product.countries_served.map((c) => ({
      '@type': 'Country',
      name: c.name,
    }))
  }

  // Map builder / author
  if (product.builder_name) {
    jsonLd.author = {
      '@type': 'Person',
      name: product.builder_name,
      ...(product.builder_url ? { url: product.builder_url } : {}),
    }
  }

  // ACCURACY RULE: Emit offers ONLY when pricing_model === 'free' with price 0.
  // For usage-based or contact-for-pricing, do not fabricate a 0 price.
  if (product.pricing_model === 'free') {
    jsonLd.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    }
  }

  // NOTE: reviews and aggregateRating are deliberately omitted because user reviews are not collected in MVP.
  return jsonLd
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildWebsiteJsonLd(siteUrl: string = 'https://dropyoursaas.co.za') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OriginIndex',
    url: `${siteUrl}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/discover/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildArticleJsonLd(resource: EditorialResource, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: resource.title,
    description: resource.excerpt,
    author: {
      '@type': 'Organization',
      name: resource.author_name || 'OriginIndex Editorial Team',
    },
    ...(resource.reviewer_name
      ? {
          editor: {
            '@type': 'Person',
            name: resource.reviewer_name,
          },
        }
      : {}),
    datePublished: resource.published_at || resource.created_at,
    dateModified: resource.last_reviewed_at || resource.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'OriginIndex',
      url: 'https://dropyoursaas.co.za',
    },
    ...(resource.citations && resource.citations.length > 0
      ? {
          citation: resource.citations.map((c) => c.title),
        }
      : {}),
  }
}
