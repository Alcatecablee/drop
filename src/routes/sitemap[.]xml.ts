import { createFileRoute } from '@tanstack/react-router'
import {
  getPublishedProducts,
  getActiveCountries,
  getCategories,
  getPublishedResources,
} from '../lib/supabase'

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [products, countries, categories, resources] = await Promise.all([
            getPublishedProducts(),
            getActiveCountries(),
            getCategories(),
            getPublishedResources(),
          ])

          const baseUrl = process.env.VITE_SITE_URL || 'https://dropyoursaas.co.za'

          // Strictly filter for indexable, active, and published records
          const activeCountries = countries.filter((c) => c.is_active)
          const activeCategories = categories.filter((c) => c.is_active)
          const publishedProducts = products.filter((p) => p.publication_status === 'published')
          const publishedResources = resources.filter((r) => r.publication_status === 'published')

          let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
          xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

          // Core Static Pages
          const corePages = [
            { path: '/', priority: '1.0', changefreq: 'daily' },
            { path: '/discover', priority: '0.9', changefreq: 'daily' },
            { path: '/resources', priority: '0.8', changefreq: 'weekly' },
            { path: '/submit', priority: '0.5', changefreq: 'monthly' },
          ]

          for (const page of corePages) {
            xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}${page.path}`)}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`
          }

          // Active Country Hub Pages
          for (const country of activeCountries) {
            xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/countries/${country.slug}`)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
          }

          // Active Category Hub Pages
          for (const category of activeCategories) {
            xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/categories/${category.slug}`)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
          }

          // Published Editorial Resources
          for (const resource of publishedResources) {
            const rawMod = resource.updated_at || resource.published_at || resource.created_at
            const formattedDate = new Date(rawMod).toISOString().split('T')[0]
            xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/resources/${resource.slug}`)}</loc>\n    <lastmod>${escapeXml(formattedDate)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`
          }

          // Published Products ONLY (Drafts & archived are strictly excluded)
          for (const product of publishedProducts) {
            const rawMod = product.updated_at || product.published_at || product.created_at
            const formattedDate = new Date(rawMod).toISOString().split('T')[0]
            xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/products/${product.slug}`)}</loc>\n    <lastmod>${escapeXml(formattedDate)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
          }

          xml += '</urlset>'

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              // 30-min browser cache, 1-hour shared CDN cache to ensure prompt propagation of catalog updates
              'Cache-Control': 'public, max-age=1800, s-maxage=3600',
            },
          })
        } catch (err: any) {
          console.error('[Sitemap Error] Failed to generate sitemap:', err.message)
          // Fail closed with 503 rather than serving fallback or corrupted sitemap
          return new Response('Sitemap generation unavailable due to upstream database error.', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Retry-After': '300',
            },
          })
        }
      },
    },
  },
})
