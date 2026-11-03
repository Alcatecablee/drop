import { Link } from '@tanstack/react-router'
import type { ProductWithRelations } from '../lib/types'

interface SpecificationSheetProps {
  product: ProductWithRelations
}

export function SpecificationSheet({ product }: SpecificationSheetProps) {
  const verifiedDate = product.last_verified_at
    ? new Date(product.last_verified_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="border border-[#E5E5E3] bg-white p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111111] pb-3 border-b border-[#E5E5E3] mb-4">
        Software Specifications
      </h3>

      <dl className="text-xs divide-y divide-[#F1F1EF]">
        {/* Verification */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Verification Status</dt>
          <dd className="text-right font-medium text-[#111111]">
            {product.verification_status === 'verified' ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[#111111]">
                  Verified {verifiedDate ? `(${verifiedDate})` : ''}
                </span>
                {product.is_founder_submitted && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-[#E5E5E3] bg-[#F8F8F7] text-[#555552]">
                    Publisher Affiliated
                  </span>
                )}
              </div>
            ) : product.verification_status === 'community_submitted' ? (
              <span className="text-[#555552]">Community Submitted</span>
            ) : (
              <span className="text-[#888885]">Unverified Research Entry</span>
            )}
          </dd>
        </div>

        {/* Operational Status */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Operational Status</dt>
          <dd className="text-right font-medium capitalize text-[#111111]">
            {product.operational_status}
          </dd>
        </div>

        {/* Primary Category */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Category</dt>
          <dd className="text-right font-medium text-[#111111]">
            {product.primary_category ? (
              <Link
                to="/categories/$slug"
                params={{ slug: product.primary_category.slug }}
                className="hover:underline"
              >
                {product.primary_category.name}
              </Link>
            ) : (
              'General'
            )}
          </dd>
        </div>

        {/* Built In */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Country of Origin</dt>
          <dd className="text-right font-medium text-[#111111]">
            {product.country_built ? (
              <Link
                to="/countries/$slug"
                params={{ slug: product.country_built.slug }}
                className="hover:underline"
              >
                {product.country_built.name}
              </Link>
            ) : (
              'Africa'
            )}
          </dd>
        </div>

        {/* Countries Served / Availability */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Market Availability</dt>
          <dd className="text-right font-medium text-[#111111] max-w-[200px]">
            {product.availability_scope === 'global' ? (
              <span className="font-mono text-xs uppercase px-1.5 py-0.5 border border-[#E5E5E3] bg-[#F8F8F7] text-[#111111]">
                Global (Web)
              </span>
            ) : product.countries_served && product.countries_served.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-1">
                {product.countries_served.map((c, i) => (
                  <span key={c.id}>
                    <Link
                      to="/countries/$slug"
                      params={{ slug: c.slug }}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                    {i < (product.countries_served?.length || 0) - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#888885]">Unverified</span>
            )}
          </dd>
        </div>

        {/* Pricing Model */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Pricing Model</dt>
          <dd className="text-right font-medium capitalize text-[#111111]">
            {product.pricing_model.replace(/_/g, ' ')}
          </dd>
        </div>

        {/* Starting Price Display */}
        {product.starting_price_display && (
          <div className="py-2.5 flex justify-between items-start gap-4">
            <dt className="text-[#555552]">Starting Price</dt>
            <dd className="text-right font-mono font-medium text-[#111111]">
              {product.starting_price_display}
            </dd>
          </div>
        )}

        {/* Platform Type */}
        {product.platform_type && (
          <div className="py-2.5 flex justify-between items-start gap-4">
            <dt className="text-[#555552]">Platform</dt>
            <dd className="text-right font-medium text-[#111111]">
              {product.platform_type}
            </dd>
          </div>
        )}

        {/* Open Source */}
        <div className="py-2.5 flex justify-between items-start gap-4">
          <dt className="text-[#555552]">Source Code</dt>
          <dd className="text-right font-medium text-[#111111]">
            {product.is_open_source ? (
              product.github_url ? (
                <a
                  href={product.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Open Source ↗
                </a>
              ) : (
                'Open Source'
              )
            ) : (
              'Proprietary'
            )}
          </dd>
        </div>

        {/* Builder / Founder Attribution */}
        {product.builder_name && (
          <div className="py-2.5 flex justify-between items-start gap-4">
            <dt className="text-[#555552]">Builder / Lead</dt>
            <dd className="text-right font-medium text-[#111111]">
              {product.builder_url ? (
                <a
                  href={product.builder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {product.builder_name} ↗
                </a>
              ) : (
                product.builder_name
              )}
            </dd>
          </div>
        )}
      </dl>

      {/* Publisher / Founder Disclosure Footnote */}
      {product.is_founder_submitted && (
        <div className="mt-4 pt-3 border-t border-[#F1F1EF] text-[11px] text-[#555552] leading-relaxed">
          <strong className="text-[#111111]">Publisher Disclosure:</strong> QuickBridge is developed by Clive Makazhu, the operator of OriginIndex. This listing has been reviewed against the product&apos;s public website and documentation. OriginIndex has not conducted an independent security audit of the product.
        </div>
      )}
    </div>
  )
}
