import { Link } from '@tanstack/react-router'
import type { ProductWithRelations } from '../lib/types'

interface ProductCardProps {
  product: ProductWithRelations
}

export function ProductCard({ product }: ProductCardProps) {
  const monogram = product.name.slice(0, 2).toUpperCase()
  const servedCount = product.countries_served?.length || 0

  return (
    <article className="border border-[#E5E5E3] bg-white p-5 hover:border-[#CCCCCC] transition-colors flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {/* Flat bordered monogram / logo */}
            <div className="w-11 h-11 border border-[#E5E5E3] bg-[#F8F8F7] flex items-center justify-center font-bold text-sm text-[#111111] shrink-0">
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
              <h3 className="font-semibold text-base text-[#111111] leading-tight">
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="hover:underline focus:outline-none"
                >
                  {product.name}
                </Link>
              </h3>
              <p className="text-xs text-[#555552] mt-0.5">
                {product.primary_category?.name || 'Software'}
              </p>
            </div>
          </div>

          {/* Verification & Affiliation Badges */}
          <div className="flex flex-col items-end gap-1">
            {product.verification_status === 'verified' && (
              <span className="text-[11px] font-mono tracking-tight uppercase px-2 py-0.5 border border-[#111111] text-[#111111] bg-white">
                Verified
              </span>
            )}
            {product.publisher_affiliation ? (
              <span className="text-[10px] font-mono tracking-tight uppercase px-1.5 py-0.5 border border-[#E5E5E3] text-[#555552] bg-[#F8F8F7]">
                Publisher Affiliated
              </span>
            ) : product.is_founder_submitted ? (
              <span className="text-[10px] font-mono tracking-tight uppercase px-1.5 py-0.5 border border-[#E5E5E3] text-[#555552] bg-[#F8F8F7]">
                Founder Submitted
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#555552] line-clamp-2 leading-relaxed mb-4">
          {product.tagline}
        </p>
      </div>

      <div className="pt-3 border-t border-[#F1F1EF] flex items-center justify-between text-xs text-[#555552]">
        <div className="flex items-center gap-2">
          <span>
            Built in <strong className="font-medium text-[#111111]">{product.country_built?.name || 'Africa'}</strong>
          </span>
          {product.availability_scope === 'global' ? (
            <span className="text-[#555552] border border-[#E5E5E3] px-1.5 py-0.5 font-mono text-[10px] uppercase">
              Global
            </span>
          ) : product.availability_scope === 'selected_countries' ? (
            servedCount === 1 ? (
              <span className="text-[#888885]">
                · Serves 1 country
              </span>
            ) : servedCount > 1 ? (
              <span className="text-[#888885]">
                · Serves {servedCount} countries
              </span>
            ) : null
          ) : (
            <span className="text-[#888885] italic">
              · Scope unverified
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] font-medium text-[#111111]">
          {product.starting_price_display || formatPricingModel(product.pricing_model)}
        </span>
      </div>
    </article>
  )
}

function formatPricingModel(model: string) {
  switch (model) {
    case 'free':
      return 'Free'
    case 'freemium':
      return 'Freemium'
    case 'free_trial':
      return 'Free Trial'
    case 'paid_subscription':
      return 'Subscription'
    case 'usage_based':
      return 'Usage-based'
    case 'contact_for_pricing':
      return 'Contact Sales'
    default:
      return model
  }
}
