import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getProductBySlug, getPublishedProducts } from '../../lib/supabase'
import { SpecificationSheet } from '../../components/SpecificationSheet'
import { ProductCard } from '../../components/ProductCard'
import { buildProductJsonLd, buildBreadcrumbJsonLd } from '../../lib/seo'

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug)
    if (!product || product.publication_status !== 'published') {
      throw notFound()
    }

    const allProducts = await getPublishedProducts()
    const relatedProducts = allProducts
      .filter((p) => p.primary_category_id === product.primary_category_id && p.id !== product.id)
      .slice(0, 3)

    return { product, relatedProducts }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) {
      return {
        meta: [{ title: 'Product Not Found | DropYourSaaS' }],
      }
    }

    const { product } = loaderData
    const canonicalUrl = `https://dropyoursaas.co.za/products/${product.slug}/`
    const title = product.meta_title || `${product.name} – ${product.tagline} | DropYourSaaS`
    const description =
      product.meta_description ||
      `${product.description.slice(0, 145).trim()}… Built in ${product.country_built?.name || 'Africa'}. Explore pricing model, supported countries, and official website.`

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      {
        name: product.primary_category?.name || 'Software',
        url: `https://dropyoursaas.co.za/categories/${product.primary_category?.slug || 'software'}/`,
      },
      { name: product.name, url: canonicalUrl },
    ]

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'website' },
        ...(product.screenshot_url ? [{ property: 'og:image', content: product.screenshot_url }] : []),
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildProductJsonLd(product, canonicalUrl)),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbs)),
        },
      ],
    }
  },
  component: ProductProfilePage,
})

function ProductProfilePage() {
  const { product, relatedProducts } = Route.useLoaderData()
  const monogram = product.name.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Breadcrumb Trail */}
      <nav className="text-xs text-[#555552] mb-8 flex items-center gap-2">
        <Link to="/" className="hover:text-[#111111]">
          Home
        </Link>
        <span>/</span>
        {product.primary_category && (
          <>
            <Link
              to="/categories/$slug"
              params={{ slug: product.primary_category.slug }}
              className="hover:text-[#111111]"
            >
              {product.primary_category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#111111] font-medium">{product.name}</span>
      </nav>

      {/* Discontinued Operational Warning Banner if applicable */}
      {product.operational_status === 'discontinued' && (
        <div className="mb-8 p-4 border border-red-300 bg-red-50 text-red-900 text-sm">
          <strong>Notice:</strong> This software product has been discontinued or operations have ceased. Information is retained for historical and architectural reference.
        </div>
      )}

      {/* Profile Grid: Main Content + Sidebar Specification Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Header Block */}
          <div className="border-b border-[#E5E5E3] pb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 border border-[#E5E5E3] bg-[#F8F8F7] flex items-center justify-center font-bold text-lg text-[#111111] shrink-0">
                {product.logo_url ? (
                  <img
                    src={product.logo_url}
                    alt={product.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span>{monogram}</span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm sm:text-base text-[#555552] mt-1 leading-snug">
                  {product.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <a
                href={product.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#111111] bg-[#111111] text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Visit Official Website ↗
              </a>
              {product.github_url && (
                <a
                  href={product.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E5E3] text-[#111111] text-xs sm:text-sm font-medium hover:bg-[#F8F8F7] transition-colors"
                >
                  GitHub Repository ↗
                </a>
              )}
            </div>
          </div>

          {/* Overview Narrative */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] mb-3">
              Overview &amp; Purpose
            </h2>
            <div className="text-sm text-[#333331] leading-relaxed space-y-4">
              <p>{product.description}</p>
            </div>
          </section>

          {/* Commercial & Pricing Narrative */}
          <section className="pt-8 border-t border-[#E5E5E3]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] mb-3">
              Commercial &amp; Pricing Model
            </h2>
            <div className="bg-[#F8F8F7] border border-[#E5E5E3] p-5 text-sm text-[#333331]">
              <div className="mb-2">
                <span className="text-xs uppercase tracking-wider text-[#555552] block">
                  Model
                </span>
                <span className="text-base font-bold text-[#111111] capitalize">
                  {product.starting_price_display || product.pricing_model.replace(/_/g, ' ')}
                </span>
              </div>
              {product.pricing_details && (
                <p className="text-xs sm:text-sm text-[#555552] leading-relaxed mt-2 pt-2 border-t border-[#E5E5E3]">
                  {product.pricing_details}
                </p>
              )}
              {product.supported_payment_gateways && product.supported_payment_gateways.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E5E5E3] text-xs text-[#555552]">
                  <strong className="text-[#111111]">Supported Payment Rails: </strong>
                  {product.supported_payment_gateways.join(', ')}
                </div>
              )}
            </div>
          </section>

          {/* Regional Availability */}
          <section className="pt-8 border-t border-[#E5E5E3]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] mb-3">
              Regional Availability &amp; Engineering Origin
            </h2>
            <p className="text-sm text-[#555552] leading-relaxed">
              This software was built by engineering teams based in{' '}
              <strong className="text-[#111111] font-semibold">
                {product.country_built?.name || 'Africa'}
              </strong>
              .{' '}
              {product.availability_scope === 'global' ? (
                <>It operates as an open, globally accessible web service without regional geographical restrictions.</>
              ) : (
                <>
                  It delivers active platform support and local market integrations for customers across:{' '}
                  <span className="text-[#111111] font-medium">
                    {product.countries_served?.map((c) => c.name).join(', ') || 'Regional markets'}
                  </span>
                  .
                </>
              )}
            </p>
          </section>

          {/* Related Products in Same Category */}
          {relatedProducts.length > 0 && (
            <section className="pt-8 border-t border-[#E5E5E3]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] mb-4">
                More in {product.primary_category?.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Specification Sheet */}
        <aside className="lg:col-span-1">
          <SpecificationSheet product={product} />
        </aside>
      </div>
    </div>
  )
}
