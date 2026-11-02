import { createFileRoute } from '@tanstack/react-router'
import {
  getPublishedProducts,
  getActiveCountries,
  getCategories,
  getPublishedResources,
} from '../lib/supabase'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const [products, countries, categories, resources] = await Promise.all([
          getPublishedProducts(),
          getActiveCountries(),
          getCategories(),
          getPublishedResources(),
        ])

        const baseUrl = process.env.VITE_SITE_URL || 'https://dropyoursaas.co.za'

        // Only include genuinely published products
        const publishedProducts = products.filter(
          (p) => p.publication_status === 'published'
        )

        // Only include genuinely published resources
        const publishedResources = resources.filter(
          (r) => r.publication_status === 'published'
        )

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
          xml += `  <url>\n    <loc>${baseUrl}${page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`
        }

        // Active Country Hub Pages
        for (const country of countries) {
          xml += `  <url>\n    <loc>${baseUrl}/countries/${country.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
        }

        // Active Category Hub Pages
        for (const category of categories) {
          xml += `  <url>\n    <loc>${baseUrl}/categories/${category.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
        }

        // Published Editorial Resources
        for (const resource of publishedResources) {
          const lastMod = resource.updated_at || resource.published_at || resource.created_at
          xml += `  <url>\n    <loc>${baseUrl}/resources/${resource.slug}</loc>\n    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`
        }

        // Published Products ONLY (Drafts & archived are strictly excluded)
        for (const product of publishedProducts) {
          const lastMod = product.updated_at || product.published_at || product.created_at
          xml += `  <url>\n    <loc>${baseUrl}/products/${product.slug}</loc>\n    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
        }

        xml += '</urlset>'

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        })
      },
    },
  },
})
