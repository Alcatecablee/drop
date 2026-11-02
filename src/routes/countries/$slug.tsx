import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getCountryBySlug, getPublishedProducts } from '../../lib/supabase'
import { ProductCard } from '../../components/ProductCard'
import { buildBreadcrumbJsonLd } from '../../lib/seo'

export const Route = createFileRoute('/countries/$slug')({
  loader: async ({ params }) => {
    const country = await getCountryBySlug(params.slug)
    if (!country) throw notFound()

    const allProducts = await getPublishedProducts()
    const builtHere = allProducts.filter((p) => p.country_built_id === country.id)
    const availableHere = allProducts.filter((p) =>
      p.countries_served?.some((c) => c.id === country.id)
    )

    return { country, builtHere, availableHere }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.country) {
      return { meta: [{ title: 'Country Not Found | DropYourSaaS' }] }
    }
    const { country } = loaderData
    const canonicalUrl = `https://dropyoursaas.co.za/countries/${country.slug}/`
    const title = country.meta_title || `Software Built & Supported in ${country.name} | DropYourSaaS`
    const description =
      country.meta_description ||
      `Discover verified software built in ${country.name} or supporting local ${country.currency_code} payment rails and compliance.`

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Countries', url: 'https://dropyoursaas.co.za/discover/' },
      { name: country.name, url: canonicalUrl },
    ]

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbs)),
        },
      ],
    }
  },
  component: CountryHubPage,
})

function CountryHubPage() {
  const { country, builtHere, availableHere } = Route.useLoaderData()
  const [tab, setTab] = useState<'built' | 'available'>('built')

  const activeList = tab === 'built' ? builtHere : availableHere

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="border-b border-[#E5E5E3] pb-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{country.flag_emoji}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
            Software in {country.name}
          </h1>
        </div>
        <p className="text-sm text-[#555552] max-w-2xl leading-relaxed">
          {country.meta_description ||
            `Explore verified software engineered in ${country.name} and applications supporting local ${country.currency_code} payments and integrations.`}
        </p>

        {/* Tab Switcher: Built In vs. Available In */}
        <div className="flex gap-4 mt-6 text-xs sm:text-sm">
          <button
            onClick={() => setTab('built')}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              tab === 'built'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-[#555552] hover:text-[#111111]'
            }`}
          >
            Built in {country.name} ({builtHere.length})
          </button>
          <button
            onClick={() => setTab('available')}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              tab === 'available'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-[#555552] hover:text-[#111111]'
            }`}
          >
            Available to Customers in {country.name} ({availableHere.length})
          </button>
        </div>
      </div>

      {/* Product List */}
      {activeList.length === 0 ? (
        <div className="border border-dashed border-[#E5E5E3] p-16 text-center text-sm text-[#555552]">
          No published software listings found for {country.name} in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
