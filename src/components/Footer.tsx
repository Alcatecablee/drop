import { Link } from '@tanstack/react-router'
import { DEFAULT_COUNTRIES, DEFAULT_CATEGORIES } from '../lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E3] bg-[#F8F8F7] text-sm text-[#555552] mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand & Editorial Mission */}
          <div className="md:col-span-2 pr-4">
            <Link to="/" className="text-base font-bold text-[#111111] tracking-tight mb-3 inline-block">
              DropYourSaaS
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-[#555552] mb-4 max-w-md">
              An independent African software discovery index and buyer research publication. We document software
              engineered across African tech ecosystems, tracking factual pricing models, regional availability, and builder attribution.
            </p>
            <p className="text-xs text-[#888885]">
              Editorial Policy: Listings are fact-checked against live production domains and public rate cards before verification.
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
            © {new Date().getFullYear()} DropYourSaaS. African Software Discovery.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/resources" className="hover:text-[#111111]">
              Editorial Resources
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
