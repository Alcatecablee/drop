import { createFileRoute, Link } from '@tanstack/react-router'
import { getPublishedResources } from '../../lib/supabase'
import { buildBreadcrumbJsonLd } from '../../lib/seo'

export const Route = createFileRoute('/resources/')({
  loader: async () => {
    const resources = await getPublishedResources()
    return { resources }
  },
  head: () => {
    const title = 'Buyer Guides & Technical Research | DropYourSaaS'
    const description =
      'Practical guides, pricing comparisons, and technical buyer checklists for engineering and finance teams evaluating African software solutions.'
    const canonical = 'https://dropyoursaas.co.za/resources'

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Buyer Guides', url: canonical },
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

function ResourcesIndexPage() {
  const { resources } = Route.useLoaderData()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">Buyer Guides</span>
      </nav>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-8 mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Buyer Guides & Technical Checklists
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-2xl leading-relaxed">
          Independent analysis, payment rail comparisons, and infrastructure checklists to help technical buyers and business owners evaluate software across African markets.
        </p>
      </div>

      {/* Resources List */}
      <div className="divide-y divide-neutral-200 border-b border-neutral-200">
        {resources.map((resource) => (
          <article key={resource.id} className="py-8 group">
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 mb-2">
              <span>{resource.author_name}</span>
              <span>•</span>
              <time dateTime={resource.published_at || resource.created_at}>
                {new Date(resource.published_at || resource.created_at).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>

            <h2 className="text-xl font-medium tracking-tight text-neutral-900 group-hover:text-black transition-colors">
              <Link to="/resources/$slug" params={{ slug: resource.slug }} className="hover:underline">
                {resource.title}
              </Link>
            </h2>

            {resource.excerpt && (
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-3xl">
                {resource.excerpt}
              </p>
            )}

            <div className="mt-4">
              <Link
                to="/resources/$slug"
                params={{ slug: resource.slug }}
                className="text-xs font-mono font-medium text-neutral-900 hover:text-black inline-flex items-center gap-1"
              >
                Read Guide &rarr;
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
