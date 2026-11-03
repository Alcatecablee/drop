import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getPublishedProducts, getActiveCountries, getCategories } from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'

interface DiscoverSearch {
  q?: string
  category?: string
  builtIn?: string
  availableIn?: string
  pricing?: string
}

export const Route = createFileRoute('/discover')({
  validateSearch: (search: Record<string, unknown>): DiscoverSearch => {
    return {
      q: typeof search.q === 'string' ? search.q : undefined,
      category: typeof search.category === 'string' ? search.category : undefined,
      builtIn: typeof search.builtIn === 'string' ? search.builtIn : undefined,
      availableIn: typeof search.availableIn === 'string' ? search.availableIn : undefined,
      pricing: typeof search.pricing === 'string' ? search.pricing : undefined,
    }
  },
  loader: async () => {
    const [products, countries, categories] = await Promise.all([
      getPublishedProducts(),
      getActiveCountries(),
      getCategories(),
    ])
    return { products, countries, categories }
  },
  head: () => ({
    meta: [
      { title: 'Browse African Software Index | OriginIndex' },
      {
        name: 'description',
        content: 'Filter and discover verified software products across African tech ecosystems by origin country, markets served, pricing model, and category.',
      },
      { property: 'og:title', content: 'Browse African Software Index | OriginIndex' },
      { property: 'og:url', content: 'https://dropyoursaas.co.za/discover/' },
    ],
    // SEO CANONICAL RULE: Always point to canonical /discover/ regardless of filter params to avoid duplicate index bloat
    links: [{ rel: 'canonical', href: 'https://dropyoursaas.co.za/discover/' }],
  }),
  component: DiscoverPage,
})

function DiscoverPage() {
  const { products, countries, categories } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/discover' })

  // Apply filters in-memory
  const filteredProducts = products.filter((p) => {
    // 1. Keyword search (q)
    if (search.q) {
      const query = search.q.toLowerCase()
      const match =
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.builder_name && p.builder_name.toLowerCase().includes(query))
      if (!match) return false
    }

    // 2. Category
    if (search.category) {
      const cat = categories.find((c) => c.slug === search.category)
      if (cat && p.primary_category_id !== cat.id) return false
    }

    // 3. Country Built In
    if (search.builtIn) {
      const country = countries.find((c) => c.slug === search.builtIn)
      if (country && p.country_built_id !== country.id) return false
    }

    // 4. Country Available / Served
    if (search.availableIn) {
      const country = countries.find((c) => c.slug === search.availableIn)
      if (country) {
        const serves = p.countries_served?.some((cs) => cs.id === country.id)
        if (!serves) return false
      }
    }

    // 5. Pricing Model
    if (search.pricing && p.pricing_model !== search.pricing) {
      return false
    }

    return true
  })

  const updateSearch = (patch: Partial<DiscoverSearch>) => {
    navigate({
      search: (prev) => {
        const next = { ...prev, ...patch }
        // Clean empty keys
        Object.keys(next).forEach((k) => {
          if (!next[k as keyof DiscoverSearch]) {
            delete next[k as keyof DiscoverSearch]
          }
        })
        return next
      },
    })
  }

  const hasActiveFilters = Boolean(
    search.q || search.category || search.builtIn || search.availableIn || search.pricing
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E3] pb-8 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] mb-2">
          Software Directory
        </h1>
        <p className="text-sm text-[#555552] max-w-2xl leading-relaxed">
          Explore tools engineered in Africa or providing native integrations across regional payment and telecom rails.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F8F7] border border-[#E5E5E3] p-4 sm:p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Keyword Input */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-[#555552] uppercase tracking-wider mb-1">
              Search Keyword
            </label>
            <input
              type="text"
              value={search.q || ''}
              onChange={(e) => updateSearch({ q: e.target.value || undefined })}
              placeholder="Filter by name, features, or builder..."
              className="w-full px-3 py-2 border border-[#E5E5E3] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555552] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={search.category || ''}
              onChange={(e) => updateSearch({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-[#E5E5E3] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Built In Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555552] uppercase tracking-wider mb-1">
              Built In
            </label>
            <select
              value={search.builtIn || ''}
              onChange={(e) => updateSearch({ builtIn: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-[#E5E5E3] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="">All Origins</option>
              {countries.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Model Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555552] uppercase tracking-wider mb-1">
              Pricing Model
            </label>
            <select
              value={search.pricing || ''}
              onChange={(e) => updateSearch({ pricing: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-[#E5E5E3] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="">All Pricing</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid_subscription">Subscription</option>
              <option value="usage_based">Usage-based</option>
              <option value="contact_for_pricing">Contact Sales</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 pt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#555552]">
          <div>
            Showing <strong className="font-semibold text-[#111111]">{filteredProducts.length}</strong> of{' '}
            {products.length} published products
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => navigate({ search: {} })}
              className="text-xs font-medium text-[#111111] hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {filteredProducts.length === 0 ? (
        <div className="border border-dashed border-[#E5E5E3] p-16 text-center text-sm text-[#555552]">
          No published products match your selected filters. Try broadening your search or resetting filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Editorial Integrity & Staging Notice */}
          <div className="mt-12 p-6 border border-[#E5E5E3] bg-[#F8F8F7] text-xs text-[#555552] leading-relaxed">
            <div className="font-semibold text-[#111111] uppercase tracking-wider text-[11px] mb-1.5">
              OriginIndex Editorial Standard &amp; Staging Pipeline
            </div>
            <p>
              We prioritize audited accuracy over directory volume. To prevent conflicts of interest and maintain credibility, OriginIndex publishes only verified listings that meet our complete reference standard. Staged candidate products across South Africa, Nigeria, Kenya, Egypt, and Ghana are evaluated sequentially in our private pipeline before public inclusion.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
