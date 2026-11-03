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
        meta: [{ title: 'Product Not Found | OriginIndex' }],
      }
    }

    const { product } = loaderData
    const canonicalUrl = `https://dropyoursaas.co.za/products/${product.slug}/`
    const title = product.meta_title || `${product.name} – ${product.tagline} | OriginIndex`
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

      {/* Publisher Affiliation Disclosure Banner */}
      {product.publisher_affiliation && (
        <div className="mb-8 p-4 border border-[#E5E5E3] bg-[#F8F8F7] text-xs text-[#333331] leading-relaxed">
          <div className="font-semibold text-[#111111] uppercase tracking-wider text-[11px] mb-1">
            Publisher Disclosure
          </div>
          <p>
            {product.publisher_affiliation_details ||
              'QuickBridge is developed by Clive Makazhu, the publisher and operator of OriginIndex. This listing has been verified against the product\'s live web service and documentation. OriginIndex has not conducted an independent security audit of the product.'}
          </p>
        </div>
      )}

      {/* Founder Submission Notice (when not publisher affiliated) */}
      {!product.publisher_affiliation && product.is_founder_submitted && (
        <div className="mb-8 p-4 border border-[#E5E5E3] bg-white text-xs text-[#555552] leading-relaxed">
          <div className="font-semibold text-[#111111] uppercase tracking-wider text-[11px] mb-1">
            Founder Submitted Listing
          </div>
          <p>
            This listing was submitted directly by the software founder and audited by the OriginIndex editorial team against live production domains and official documentation.
          </p>
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
              ) : product.availability_scope === 'selected_countries' ? (
                <>
                  It delivers active platform support and local market integrations for customers across:{' '}
                  <span className="text-[#111111] font-medium">
                    {product.countries_served && product.countries_served.length > 0
                      ? product.countries_served.map((c) => c.name).join(', ')
                      : 'identified regional markets'}
                  </span>
                  .
                </>
              ) : (
                <>
                  Specific regional market availability and localized payment integrations have not yet been established by OriginIndex editors.
                </>
              )}
            </p>
          </section>

          {/* Editorial Verification Audit Trail: 3-Part Standard */}
          {product.verification_record && (
            <section className="pt-8 border-t border-[#E5E5E3]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-6">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[#888885] mb-1">
                    OriginIndex Reference Standard
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                    Editorial Verification Audit Trail
                  </h2>
                </div>
                <div className="text-right text-xs">
                  <span className="font-mono text-[#111111] font-semibold">
                    Audited: {new Date(product.verification_record.verification_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="block text-[11px] text-[#888885]">
                    Reviewer: {product.verification_record.reviewer_name}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* 1. Directly Observed by OriginIndex */}
                <div className="border border-[#E5E5E3] bg-white p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F1EF] mb-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full inline-block"></span>
                      1. Directly Observed by OriginIndex
                    </h3>
                    <span className="text-[10px] font-mono text-[#888885] uppercase">
                      Empirical Verification
                    </span>
                  </div>
                  <div className="text-xs text-[#333331] leading-relaxed space-y-2">
                    {product.verification_record.observed_findings ? (
                      product.verification_record.observed_findings.split('\n').map((line, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-700 font-bold">✓</span>
                          <span>{line.replace(/^\d+\.\s*/, '')}</span>
                        </p>
                      ))
                    ) : (
                      <p>{product.verification_record.test_performed}</p>
                    )}
                  </div>
                </div>

                {/* 2. Builder-Supplied Evidence */}
                <div className="border border-[#E5E5E3] bg-[#F8F8F7] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                      2. Builder-Supplied Evidence &amp; Attributions
                    </h3>
                    <span className="text-[10px] font-mono text-[#888885] uppercase">
                      Attestation &amp; Specs
                    </span>
                  </div>
                  <div className="text-xs text-[#333331] leading-relaxed space-y-2">
                    {product.verification_record.builder_supplied_evidence ? (
                      product.verification_record.builder_supplied_evidence.split('\n').map((line, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-blue-700 font-bold">•</span>
                          <span>{line.replace(/^\d+\.\s*/, '')}</span>
                        </p>
                      ))
                    ) : (
                      <>
                        <p><strong>Builder Attribution: </strong>{product.verification_record.builder_evidence}</p>
                        <p><strong>Commercial Rate Card: </strong>{product.verification_record.pricing_evidence}</p>
                        <p><strong>Architecture Notes: </strong>{product.verification_record.functionality_notes}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Audit Boundaries & What Has NOT Been Tested */}
                <div className="border border-[#E5E5E3] bg-[#FAFAFA] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-600 rounded-full inline-block"></span>
                      3. Audit Boundaries &amp; Untested Areas
                    </h3>
                    <span className="text-[10px] font-mono text-[#888885] uppercase">
                      Independent Boundaries
                    </span>
                  </div>
                  <div className="text-xs text-[#555552] leading-relaxed space-y-2">
                    {product.verification_record.untested_boundaries ? (
                      product.verification_record.untested_boundaries.split('\n').map((line, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-amber-700 font-bold">!</span>
                          <span>{line.replace(/^\d+\.\s*/, '')}</span>
                        </p>
                      ))
                    ) : (
                      <p className="italic">{product.verification_record.limitations}</p>
                    )}
                  </div>

                  {product.verification_record.publisher_relationship && (
                    <div className="mt-4 pt-3 border-t border-[#E5E5E3] text-xs text-[#111111] font-medium bg-[#F1F1EF] p-2.5">
                      <strong>Publisher Disclosure: </strong>
                      {product.verification_record.publisher_relationship}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

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
