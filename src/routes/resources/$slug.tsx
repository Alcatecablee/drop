import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getPublishedResources } from '../../lib/supabase'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '../../lib/seo'

export const Route = createFileRoute('/resources/$slug')({
  loader: async ({ params }) => {
    const resources = await getPublishedResources()
    const resource = resources.find((r) => r.slug === params.slug)
    if (!resource) {
      throw notFound()
    }
    return { resource }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.resource) return {}
    const { resource } = loaderData
    const canonical = `https://dropyoursaas.co.za/resources/${resource.slug}`
    const title = resource.meta_title || `${resource.title} | OriginIndex`
    const description = resource.meta_description || resource.excerpt || ''

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Buyer Guides', url: 'https://dropyoursaas.co.za/resources' },
      { name: resource.title, url: canonical },
    ]

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary' },
      ],
      links: [{ rel: 'canonical', href: canonical }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildArticleJsonLd(resource, canonical)),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbs)),
        },
      ],
    }
  },
  component: ResourceDetailPage,
})

function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  let currentList: string[] = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc list-outside ml-5 my-4 space-y-2 text-neutral-800 text-sm leading-relaxed">
          {currentList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      )
      currentList = []
    }
  }

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-neutral-100 font-mono text-xs border border-neutral-200 rounded-none">$1</code>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('- ')) {
      currentList.push(line.substring(2))
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      currentList.push(line.replace(/^\d+\.\s/, ''))
      continue
    }

    flushList()

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-neutral-900 mt-6 mb-2 tracking-tight">
          {line.substring(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-xl font-semibold text-neutral-950 mt-8 mb-3 tracking-tight border-b border-neutral-200 pb-2">
          {line.substring(3)}
        </h2>
      )
    } else if (line.length > 0) {
      elements.push(
        <p key={key++} className="text-neutral-700 text-sm leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  }

  flushList()
  return elements
}

function ResourceDetailPage() {
  const { resource } = Route.useLoaderData()

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <Link to="/resources" className="hover:text-black">Buyer Guides</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-xs">{resource.title}</span>
      </nav>

      {/* Article Header */}
      <header className="border-b border-neutral-200 pb-8 mb-8">
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 mb-3">
          <span>{resource.author_name}</span>
          <span>•</span>
          <time dateTime={resource.published_at || resource.created_at}>
            {new Date(resource.published_at || resource.created_at).toLocaleDateString('en-ZA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-950 leading-tight">
          {resource.title}
        </h1>

        {resource.excerpt && (
          <p className="mt-3 text-base text-neutral-600 leading-relaxed font-normal">
            {resource.excerpt}
          </p>
        )}
      </header>

      {/* Article Body */}
      <div className="prose prose-neutral max-w-none">
        {renderMarkdown(resource.content_markdown)}
      </div>

      {/* Editorial Footer / Next Steps */}
      <footer className="mt-12 pt-8 border-t border-neutral-200">
        <div className="bg-neutral-50 border border-neutral-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-900">Are you building software for African markets?</h3>
            <p className="text-xs text-neutral-600 mt-1">
              Submit your product for independent editorial review and catalogue indexing.
            </p>
          </div>
          <Link
            to="/submit"
            className="text-xs font-mono uppercase tracking-wider px-4 py-2 bg-neutral-900 text-white font-medium hover:bg-black transition-colors whitespace-nowrap"
          >
            Submit Software
          </Link>
        </div>

        <div className="mt-6">
          <Link to="/resources" className="text-xs font-mono text-neutral-600 hover:text-black inline-flex items-center gap-1">
            &larr; Back to all Buyer Guides
          </Link>
        </div>
      </footer>
    </article>
  )
}
