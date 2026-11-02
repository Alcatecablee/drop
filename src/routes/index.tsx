import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getPublishedProducts, getActiveCountries, getCategories } from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'
import { buildWebsiteJsonLd } from '../lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [products, countries, categories] = await Promise.all([
      getPublishedProducts(),
      getActiveCountries(),
      getCategories(),
    ])
    return { products, countries, categories }
  },
  head: () => {
    return {
      meta: [
        { title: 'OriginIndex — Discover Software. Trace Its Origin.' },
        {
          name: 'description',
          content: 'An independent index of software products, engineering teams, and technology companies built across Africa. Factual pricing, regional availability, and verified builder provenance.',
        },
        { property: 'og:title', content: 'OriginIndex — Discover Software. Trace Its Origin.' },
        { property: 'og:description', content: 'An independent index of software products, engineering teams, and technology companies built across Africa. Factual pricing, regional availability, and verified builder provenance.' },
        { property: 'og:url', content: 'https://dropyoursaas.co.za/' },
        { name: 'twitter:card', content: 'summary' },
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

function HomePage() {
  const { products, countries, categories } = Route.useLoaderData()
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-3xl mb-16">
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-3">
          Independent African Software Discovery
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] leading-tight mb-4">
          Discover software. Trace its origin.
        </h1>
        <p className="text-base sm:text-lg text-[#555552] leading-relaxed mb-8">
          An independent index of software products, engineering teams, and technology companies built across Africa.
          Factual pricing, regional payment rails, and verified builder provenance.
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

      {/* Country Hubs Quick Jump */}
      <section className="mb-16 pt-8 border-t border-[#E5E5E3]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Explore by Market
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
                  <span className="font-mono">{builtCount}</span> built locally
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Published Software Directory Section */}
      <section className="mb-16 pt-8 border-t border-[#E5E5E3]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">
              Software Catalogue
            </h2>
            <p className="text-xs text-[#555552] mt-0.5">
              Software entries audited for active domain uptime, builder provenance, and commercial availability.
            </p>
          </div>
          {products.length > 0 && (
            <Link
              to="/discover"
              className="text-xs font-semibold text-[#111111] hover:underline"
            >
              Browse all ({products.length}) →
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="border border-neutral-200 bg-[#F8F8F7] p-10 text-center">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-2">
              OriginIndex Editorial Staging
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">
              Initial Candidate Audits in Progress
            </h3>
            <p className="text-xs text-neutral-600 max-w-lg mx-auto mb-6 leading-relaxed">
              OriginIndex has staged 20 initial software candidates across South Africa, Nigeria, Kenya, Egypt, and Zimbabwe.
              Entries are published sequentially following editorial verification of live domain operations, factual commercial pricing tiers, and direct builder attribution.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/submit"
                className="text-xs font-mono uppercase tracking-wider px-4 py-2 bg-neutral-900 text-white hover:bg-black transition-colors"
              >
                Submit Software for Review
              </Link>
              <Link
                to="/resources"
                className="text-xs font-mono uppercase tracking-wider px-4 py-2 border border-neutral-300 text-neutral-700 hover:border-black transition-colors"
              >
                Read Buyer Guides &amp; Methodology
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 9).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
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
