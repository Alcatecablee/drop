import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getPublishedResources } from '../../lib/supabase'
import { buildBreadcrumbJsonLd } from '../../lib/seo'
import type { ResourceCategory } from '../../lib/types'

interface ResourceSearch {
  category?: string
}

export const Route = createFileRoute('/resources/')({
  validateSearch: (search: Record<string, unknown>): ResourceSearch => {
    return {
      category: typeof search.category === 'string' ? search.category : undefined,
    }
  },
  loader: async () => {
    const resources = await getPublishedResources()
    return { resources }
  },
  head: () => {
    const title = 'Editorial Resources, Research & Buyer Guides | OriginIndex'
    const description =
      'Independent technology explainers, buyer due diligence frameworks, software pricing models, and regional landscape research across African tech ecosystems.'
    const canonical = 'https://dropyoursaas.co.za/resources'

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Editorial Resources', url: canonical },
    ]

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonical },
        { name: 'twitter:card', content: 'summary' },
      ],
      links: [{ rel: 'canonical', href: canonical }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbs)),
        },
      ],
    }
  },
  component: ResourcesIndexPage,
})

const CATEGORIES: { name: string; slug: string; description: string }[] = [
  {
    name: 'All Resources',
    slug: 'all',
    description: 'All independent research papers, technology explainers, and buyer guides published by OriginIndex.',
  },
  {
    name: 'Buyer Guides',
    slug: 'buyer-guides',
    description: 'Practical due diligence frameworks, pricing analyses, and technical checklists to help businesses evaluate software intelligently.',
  },
  {
    name: 'Technology Explainers',
    slug: 'technology-explainers',
    description: 'Deep dives explaining how software actually works: peer-to-peer data channels, local-first protocols, WebRTC, and cloud architectures.',
  },
  {
    name: 'African Software Landscape',
    slug: 'african-software-landscape',
    description: 'Explorations of regional engineering provenance, local payment rails, statutory compliance, and software availability across African markets.',
  },
  {
    name: 'Research & Reports',
    slug: 'research-reports',
    description: 'Original data studies, empirical surveys, and market analyses of the African software ecosystem.',
  },
]

function getCategorySlug(categoryName: string): string {
  switch (categoryName) {
    case 'Buyer Guides':
      return 'buyer-guides'
    case 'Technology Explainers':
      return 'technology-explainers'
    case 'African Software Landscape':
      return 'african-software-landscape'
    case 'Research & Reports':
      return 'research-reports'
    default:
      return 'all'
  }
}

function ResourcesIndexPage() {
  const { resources } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/resources' })

  const activeCategorySlug = search.category || 'all'
  const currentCategoryObj = CATEGORIES.find((c) => c.slug === activeCategorySlug) || CATEGORIES[0]

  const filteredResources = resources.filter((resource) => {
    if (activeCategorySlug === 'all') return true
    return getCategorySlug(resource.category) === activeCategorySlug
  })

  const setCategoryFilter = (slug: string) => {
    navigate({
      search: slug === 'all' ? {} : { category: slug },
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#555552] flex items-center space-x-2">
        <Link to="/" className="hover:text-[#111111]">Home</Link>
        <span>/</span>
        <span className="text-[#111111] font-medium">Editorial Resources</span>
      </nav>

      {/* Header */}
      <div className="border-b border-[#E5E5E3] pb-8 mb-10">
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-2">
          OriginIndex Editorial Publication
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
          Editorial Resources &amp; Research
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#555552] max-w-3xl leading-relaxed">
          Independent technology explainers, buyer evaluation frameworks, and regional software research. We publish actionable technical and commercial analysis to help companies evaluate software with factual confidence.
        </p>
      </div>

      {/* Category Navigation Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E3] pb-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategorySlug === cat.slug
            const count = cat.slug === 'all'
              ? resources.length
              : resources.filter((r) => getCategorySlug(r.category) === cat.slug).length

            return (
              <button
                key={cat.slug}
                onClick={() => setCategoryFilter(cat.slug)}
                className={`text-xs font-medium px-3.5 py-1.5 transition-colors border ${
                  isActive
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#E5E5E3] bg-[#F8F8F7] text-[#555552] hover:border-[#111111] hover:text-[#111111]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`ml-1.5 font-mono text-[11px] ${isActive ? 'text-neutral-300' : 'text-[#888885]'}`}>
                  ({count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Category Description Banner */}
        <div className="mt-3 text-xs text-[#555552] bg-[#F8F8F7] border border-[#E5E5E3] p-3.5">
          <strong className="text-[#111111]">{currentCategoryObj.name}:</strong> {currentCategoryObj.description}
        </div>
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div className="border border-[#E5E5E3] bg-[#F8F8F7] p-12 text-center my-8">
          <p className="text-sm text-[#555552]">No articles currently published under this category.</p>
          <button
            onClick={() => setCategoryFilter('all')}
            className="mt-4 text-xs font-mono uppercase tracking-wider px-4 py-2 bg-[#111111] text-white"
          >
            View All Resources
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#E5E5E3] border-b border-[#E5E5E3]">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="py-8 group">
              <div className="flex flex-wrap items-center gap-3 text-xs mb-2.5">
                <span className="font-mono uppercase text-[10px] px-2 py-0.5 border border-[#111111] text-[#111111] bg-white">
                  {resource.category || 'Buyer Guides'}
                </span>
                <span className="text-[#888885]">•</span>
                <span className="font-mono text-[#555552] text-xs">
                  {resource.reading_time_minutes || 5} min read
                </span>
                <span className="text-[#888885]">•</span>
                <span className="text-[#888885]">
                  {resource.author_name}
                </span>
                <span className="text-[#888885]">•</span>
                <time
                  dateTime={resource.published_at || resource.created_at}
                  className="text-[#888885]"
                >
                  {new Date(resource.published_at || resource.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] group-hover:underline">
                <Link to="/resources/$slug" params={{ slug: resource.slug }}>
                  {resource.title}
                </Link>
              </h2>

              {resource.excerpt && (
                <p className="mt-2.5 text-sm sm:text-base text-[#555552] leading-relaxed max-w-3xl">
                  {resource.excerpt}
                </p>
              )}

              <div className="mt-4">
                <Link
                  to="/resources/$slug"
                  params={{ slug: resource.slug }}
                  className="text-xs font-medium text-[#111111] hover:underline inline-flex items-center gap-1"
                >
                  Read full analysis →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Editorial Proposal Box */}
      <section className="mt-16 border border-[#E5E5E3] bg-[#F8F8F7] p-8">
        <div className="max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-wider text-[#888885] mb-2">
            Independent Research Desk
          </div>
          <h3 className="text-lg font-bold text-[#111111] mb-2">
            Propose a Software Topic or Case Study
          </h3>
          <p className="text-xs sm:text-sm text-[#555552] leading-relaxed mb-6">
            OriginIndex explores real architectural trade-offs, pricing mechanics, and compliance challenges across African tech ecosystems. If your team is analyzing a complex software landscape or technical dilemma, contact our editorial team.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/submit"
              className="text-xs font-medium px-4 py-2.5 bg-[#111111] text-white hover:bg-neutral-800 transition-colors"
            >
              Submit Software for Research
            </Link>
            <Link
              to="/"
              className="text-xs font-medium px-4 py-2.5 border border-[#E5E5E3] text-[#111111] bg-white hover:border-[#111111] transition-colors"
            >
              Back to Index Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
