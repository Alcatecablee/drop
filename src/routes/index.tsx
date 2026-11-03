import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getPublishedProducts,
  getActiveCountries,
  getCategories,
  getPublishedResources,
} from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'
import { buildWebsiteJsonLd } from '../lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [products, countries, categories, resources] = await Promise.all([
      getPublishedProducts(),
      getActiveCountries(),
      getCategories(),
      getPublishedResources(),
    ])
    return { products, countries, categories, resources }
  },
  head: () => {
    return {
      meta: [
        { title: 'OriginIndex — Discover Software. Trace Its Origin.' },
        {
          name: 'description',
          content:
            'An independent African software publication and discovery index. Verified software profiles, technology explainers, buyer evaluation frameworks, and regional landscape research.',
        },
        { property: 'og:title', content: 'OriginIndex — Discover Software. Trace Its Origin.' },
        {
          property: 'og:description',
          content:
            'An independent African software publication and discovery index. Verified software profiles, technology explainers, buyer evaluation frameworks, and regional landscape research.',
        },
        { property: 'og:url', content: 'https://dropyoursaas.co.za/' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: 'https://dropyoursaas.co.za/' }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildWebsiteJsonLd()),
        },
      ],
    }
  },
  component: HomePage,
})

const RESOURCE_CATEGORIES_OVERVIEW = [
  {
    title: 'Buyer Guides',
    slug: 'buyer-guides',
    description: 'Help businesses choose software intelligently with practical evaluation checklists and pricing breakdowns.',
  },
  {
    title: 'Technology Explainers',
    slug: 'technology-explainers',
    description: 'Explain how software actually works: peer-to-peer data channels, local-first protocols, and cloud architectures.',
  },
  {
    title: 'African Software Landscape',
    slug: 'african-software-landscape',
    description: 'Explore engineering provenance, domestic payment rails, statutory compliance, and genuine market availability.',
  },
  {
    title: 'Research & Reports',
    slug: 'research-reports',
    description: 'Original research, empirical ecosystem surveys, and commercial benchmark studies.',
  },
]

function HomePage() {
  const { products, countries, categories, resources } = Route.useLoaderData()
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate({ to: '/discover', search: { q: searchTerm.trim() } })
    } else {
      navigate({ to: '/discover' })
    }
  }

  // Filter QuickBridge as the reference product
  const referenceProduct = products.find((p) => p.slug === 'quickbridge') || products[0]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-3xl mb-16">
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-3">
          Independent African Software Publication &amp; Discovery Index
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] leading-tight mb-4">
          Discover software. Trace its origin.
        </h1>
        <p className="text-base sm:text-lg text-[#555552] leading-relaxed mb-8">
          An independent publication and discovery index documenting African software engineering, verified pricing models, and regional infrastructure. We publish in-depth technical explainers and buyer guides while carefully verifying software provenance.
        </p>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <input
            type="text"
            placeholder="Search software by name, origin country, category, or stack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-[#E5E5E3] text-sm text-[#111111] focus:outline-none focus:border-[#111111] placeholder-[#888885]"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#111111] text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Search Index
          </button>
        </form>
      </section>

      {/* Featured Editorial Resources Section */}
      <section className="mb-20 pt-8 border-t border-[#E5E5E3]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
              Editorial Publications
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111111]">
              Research, Buyer Guides &amp; Technology Explainers
            </h2>
            <p className="text-xs sm:text-sm text-[#555552] mt-1">
              Original analysis and technical due diligence frameworks to help companies evaluate software with factual confidence.
            </p>
          </div>
          <Link
            to="/resources"
            className="text-xs font-semibold text-[#111111] hover:underline whitespace-nowrap"
          >
            Browse all resources ({resources.length}) →
          </Link>
        </div>

        {/* 4 Category Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {RESOURCE_CATEGORIES_OVERVIEW.map((col) => (
            <Link
              key={col.slug}
              to="/resources"
              search={{ category: col.slug }}
              className="border border-[#E5E5E3] bg-[#F8F8F7] p-5 hover:border-[#111111] hover:bg-white transition-colors flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-sm text-[#111111] mb-1.5">
                  {col.title}
                </h3>
                <p className="text-xs text-[#555552] leading-relaxed">
                  {col.description}
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#111111] mt-4 block">
                Explore guides →
              </span>
            </Link>
          ))}
        </div>

        {/* Top 5 Priority Resource Articles */}
        <div className="border border-[#E5E5E3] bg-white divide-y divide-[#E5E5E3]">
          {resources.slice(0, 5).map((resource, idx) => (
            <article key={resource.id} className="p-5 sm:p-6 hover:bg-[#FAFAFA] transition-colors">
              <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                <span className="font-mono uppercase text-[10px] px-2 py-0.5 border border-[#111111] text-[#111111] bg-[#F8F8F7]">
                  {resource.category || 'Buyer Guides'}
                </span>
                <span className="text-[#888885]">•</span>
                <span className="font-mono text-[#555552] text-xs">
                  {resource.reading_time_minutes || 5} min read
                </span>
                <span className="text-[#888885]">•</span>
                <span className="text-[#888885]">
                  {resource.author_name}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#111111] mb-2 leading-snug">
                <Link to="/resources/$slug" params={{ slug: resource.slug }} className="hover:underline">
                  {resource.title}
                </Link>
              </h3>

              <p className="text-xs sm:text-sm text-[#555552] leading-relaxed line-clamp-2 max-w-4xl">
                {resource.excerpt}
              </p>

              <div className="mt-3">
                <Link
                  to="/resources/$slug"
                  params={{ slug: resource.slug }}
                  className="text-xs font-semibold text-[#111111] hover:underline inline-flex items-center gap-1"
                >
                  Read full analysis →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* OriginIndex Reference Product Section */}
      <section className="mb-20 pt-8 border-t border-[#E5E5E3]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
              OriginIndex Reference Listing
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111111]">
              The QuickBridge Reference Standard
            </h2>
            <p className="text-xs sm:text-sm text-[#555552] mt-1 max-w-2xl leading-relaxed">
              The first complete example of OriginIndex&apos;s editorial, verification and publication process. Every future listing in the index is measured against this benchmark of factual pricing, availability classification, and builder provenance.
            </p>
          </div>
          <Link
            to="/products/$slug"
            params={{ slug: 'quickbridge' }}
            className="text-xs font-semibold text-[#111111] hover:underline whitespace-nowrap self-start"
          >
            View full profile &amp; audit trail →
          </Link>
        </div>

        {referenceProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProductCard product={referenceProduct} />
            </div>

            {/* Editorial Standard Context Card */}
            <div className="border border-[#E5E5E3] bg-[#F8F8F7] p-6 flex flex-col justify-between text-xs">
              <div>
                <div className="font-semibold text-[#111111] uppercase tracking-wider text-[11px] mb-2">
                  Editorial Principle
                </div>
                <h4 className="font-bold text-sm text-[#111111] mb-2">
                  Quality Over Artificial Volume
                </h4>
                <p className="text-[#555552] leading-relaxed mb-4">
                  We refuse to populate the directory simply to make it look busy, and we do not masquerade publisher-affiliated products as an independent catalogue.
                </p>
                <p className="text-[#555552] leading-relaxed">
                  QuickBridge serves as our single published reference model. External African software products are currently undergoing private editorial review and will be published sequentially as audits complete.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5E5E3] mt-6">
                <Link
                  to="/products/$slug"
                  params={{ slug: 'quickbridge' }}
                  className="font-mono text-[11px] text-[#111111] font-medium hover:underline block"
                >
                  Inspect Specification Sheet &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Country Hubs Quick Jump */}
      <section className="mb-16 pt-8 border-t border-[#E5E5E3]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Explore by Regional Market
          </h2>
          <span className="text-xs text-[#888885]">5 Active Regional Hubs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {countries.map((c) => {
            const builtCount = products.filter((p) => p.country_built_id === c.id).length
            return (
              <Link
                key={c.id}
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="border border-[#E5E5E3] bg-[#F8F8F7] p-4 hover:border-[#111111] hover:bg-white transition-colors block"
              >
                <div className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-base">{c.flag_emoji}</span>
                </div>
                <div className="text-xs text-[#555552] mt-2">
                  <span className="font-mono">{builtCount}</span> verified {builtCount === 1 ? 'entry' : 'entries'}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Category Index Grid */}
      <section className="pt-8 border-t border-[#E5E5E3]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Software Categories
          </h2>
          <Link to="/discover" className="text-xs text-[#555552] hover:text-[#111111]">
            View Directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const count = products.filter((p) => p.primary_category_id === cat.id).length
            return (
              <Link
                key={cat.id}
                to="/categories/$slug"
                params={{ slug: cat.slug }}
                className="border border-[#E5E5E3] p-4 hover:border-[#111111] bg-white transition-colors block"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-[#111111]">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-mono text-[#888885] shrink-0">
                    ({count})
                  </span>
                </div>
                <p className="text-xs text-[#555552] line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
