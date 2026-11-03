import { Link } from '@tanstack/react-router'
import { DEFAULT_COUNTRIES, DEFAULT_CATEGORIES } from '../lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E3] bg-[#F8F8F7] text-sm text-[#555552] mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand & Editorial Mission */}
          <div className="md:col-span-2 pr-4">
            <Link to="/" className="text-base font-bold text-[#111111] tracking-tight mb-1 inline-block">
              OriginIndex
            </Link>
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              Discover software. Trace its origin.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#555552] mb-4 max-w-md">
              An independent index of software products, engineering teams, and technology companies built across Africa.
              We document factual pricing models, regional compliance rails, and verified builder provenance.
            </p>
            <p className="text-xs text-[#888885]">
              Editorial Policy: Listings are verified against live production domains, public rate cards, and builder attribution before publication. Read our{' '}
              <Link to="/methodology" className="underline hover:text-[#111111]">
                Editorial Methodology &amp; Verification Standards
              </Link>.
            </p>
          </div>

          {/* Column 2: Country Hubs */}
          <div>
            <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">
              Country Hubs
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {DEFAULT_COUNTRIES.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/countries/$slug"
                    params={{ slug: c.slug }}
                    className="hover:text-[#111111] transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Category Hubs & Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {DEFAULT_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to="/categories/$slug"
                    params={{ slug: cat.slug }}
                    className="hover:text-[#111111] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/discover" className="font-medium text-[#111111] hover:underline">
                  View all categories →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E5E5E3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#888885]">
          <div>
            © {new Date().getFullYear()} OriginIndex. African Software Discovery.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/resources" className="hover:text-[#111111]">
              Editorial Resources
            </Link>
            <Link to="/methodology" className="hover:text-[#111111]">
              Methodology
            </Link>
            <Link to="/submit" className="hover:text-[#111111]">
              Submit Software
            </Link>
            <Link to="/admin" className="hover:text-[#111111]">
              Staff Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
