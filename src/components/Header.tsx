import { Link } from '@tanstack/react-router'

export function Header() {
  return (
    <header className="border-b border-[#E5E5E3] bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#111111] hover:opacity-90 flex items-center gap-2.5"
          >
            <span className="w-3.5 h-3.5 bg-[#111111] inline-block shrink-0"></span>
            <span className="font-semibold tracking-tight">OriginIndex</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#555552]">
            <Link
              to="/discover"
              className="hover:text-[#111111] transition-colors"
              activeProps={{ className: 'text-[#111111] font-semibold' }}
            >
              Discover
            </Link>
            <Link
              to="/countries/$slug"
              params={{ slug: 'south-africa' }}
              className="hover:text-[#111111] transition-colors"
            >
              Countries
            </Link>
            <Link
              to="/categories/$slug"
              params={{ slug: 'developer-tools' }}
              className="hover:text-[#111111] transition-colors"
            >
              Categories
            </Link>
            <Link
              to="/resources"
              className="hover:text-[#111111] transition-colors"
              activeProps={{ className: 'text-[#111111] font-semibold' }}
            >
              Resources
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/submit"
            className="text-xs sm:text-sm font-medium px-3.5 py-1.5 border border-[#111111] bg-[#111111] text-white hover:bg-neutral-800 transition-colors"
          >
            Submit Software
          </Link>
        </div>
      </div>
    </header>
  )
}
