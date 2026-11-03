import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getPublishedResources } from '../../lib/supabase'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '../../lib/seo'
import type { ResourceCategory } from '../../lib/types'

export const Route = createFileRoute('/resources/$slug')({
  loader: async ({ params }) => {
    const resources = await getPublishedResources()
    const resource = resources.find((r) => r.slug === params.slug)
    if (!resource) {
      throw notFound()
    }
    const relatedResources = resources
      .filter((r) => r.slug !== resource.slug)
      .slice(0, 3)

    return { resource, relatedResources }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.resource) return {}
    const { resource } = loaderData
    const canonical = `https://dropyoursaas.co.za/resources/${resource.slug}`
    const title = resource.meta_title || `${resource.title} | OriginIndex`
    const description = resource.meta_description || resource.excerpt || ''

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Editorial Resources', url: 'https://dropyoursaas.co.za/resources' },
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

function formatInline(text: string): string {
  return text
    .replace(/\[(.*?)\]\((.*?)\)/g, (_, label, url) => {
      const isInternal = url.startsWith('/')
      if (isInternal) {
        return `<a href="${url}" class="underline hover:text-black font-medium text-[#111111]">${label}</a>`
      }
      return `<a href="${url}" class="underline hover:text-black font-medium text-[#111111]" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-neutral-100 font-mono text-xs border border-neutral-200 text-neutral-900">$1</code>')
}

function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
  let tableRows: string[][] = []
  let inCodeBlock = false
  let codeBlockLines: string[] = []

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${key++}`} className="list-disc list-outside ml-5 my-4 space-y-2 text-[#333331] text-sm leading-relaxed">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`ol-${key++}`} className="list-decimal list-outside ml-5 my-4 space-y-2 text-[#333331] text-sm leading-relaxed">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        )
      }
      currentList = null
    }
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0]
      const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())))

      elements.push(
        <div key={`table-${key++}`} className="overflow-x-auto my-6 border border-[#E5E5E3]">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F8F7] border-b border-[#E5E5E3]">
                {headerRow.map((cell, idx) => (
                  <th key={idx} className="p-3 font-semibold text-[#111111] border-r border-[#E5E5E3] last:border-r-0">
                    <span dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3] bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#FAFAFA]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 text-[#333331] border-r border-[#E5E5E3] last:border-r-0 leading-relaxed align-top">
                      <span dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
    }
  }

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <pre key={`code-${key++}`} className="bg-[#111111] text-neutral-200 p-4 font-mono text-xs overflow-x-auto my-5 leading-relaxed">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      )
      inCodeBlock = false
      codeBlockLines = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // Fenced code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        flushList()
        flushTable()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    // Markdown tables
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList()
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
      tableRows.push(cells)
      continue
    } else {
      flushTable()
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(line.substring(2))
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(line.replace(/^\d+\.\s/, ''))
      continue
    }

    flushList()

    // Horizontal Rule
    if (line === '---' || line === '***') {
      elements.push(<hr key={key++} className="my-8 border-[#E5E5E3]" />)
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className="border-l-2 border-[#111111] pl-4 my-4 italic text-[#555552] text-sm leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
        </blockquote>
      )
      continue
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={key++} className="text-sm font-semibold uppercase tracking-wider text-[#111111] mt-6 mb-2">
          {line.substring(5)}
        </h4>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-base font-bold text-[#111111] mt-6 mb-2 tracking-tight">
          {line.substring(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-[#111111] mt-8 mb-3 tracking-tight border-b border-[#E5E5E3] pb-2">
          {line.substring(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      // Skip top H1 inside body as it is in the header
      continue
    } else if (line.length > 0) {
      elements.push(
        <p key={key++} className="text-[#333331] text-sm leading-relaxed my-3.5" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  }

  flushList()
  flushTable()
  flushCodeBlock()

  return elements
}

function ResourceDetailPage() {
  const { resource, relatedResources } = Route.useLoaderData()

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-14">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#555552] flex items-center space-x-2">
        <Link to="/" className="hover:text-[#111111]">Home</Link>
        <span>/</span>
        <Link to="/resources" className="hover:text-[#111111]">Editorial Resources</Link>
        <span>/</span>
        <span className="text-[#111111] font-medium truncate max-w-xs">{resource.title}</span>
      </nav>

      {/* Article Header */}
      <header className="border-b border-[#E5E5E3] pb-8 mb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
          <span className="font-mono uppercase text-[11px] px-2 py-0.5 border border-[#111111] text-[#111111] bg-[#F8F8F7]">
            {resource.category || 'Buyer Guides'}
          </span>
          <span className="text-[#888885]">•</span>
          <span className="text-[#555552]">{resource.reading_time_minutes || 5} min read</span>
          <span className="text-[#888885]">•</span>
          <span className="text-[#555552] font-medium">{resource.author_name}</span>
          {resource.author_role && (
            <span className="text-[#888885]">({resource.author_role})</span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#111111] leading-tight">
          {resource.title}
        </h1>

        {resource.excerpt && (
          <p className="mt-4 text-base sm:text-lg text-[#555552] leading-relaxed">
            {resource.excerpt}
          </p>
        )}

        {/* Editorial Review & Attribution Meta Bar */}
        <div className="mt-6 pt-4 border-t border-[#F1F1EF] flex flex-wrap items-center justify-between gap-4 text-xs text-[#555552]">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[#888885]">Published: </span>
              <time dateTime={resource.published_at || resource.created_at} className="font-medium text-[#111111]">
                {new Date(resource.published_at || resource.created_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>
            {resource.last_reviewed_at && (
              <div>
                <span className="text-[#888885]">Last Reviewed: </span>
                <time dateTime={resource.last_reviewed_at} className="font-medium text-[#111111]">
                  {new Date(resource.last_reviewed_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
            )}
            {resource.reviewer_name && (
              <div>
                <span className="text-[#888885]">Technical Reviewer: </span>
                <span className="font-medium text-[#111111]">{resource.reviewer_name}</span>
              </div>
            )}
          </div>

          <Link to="/methodology" className="font-mono text-[11px] text-[#111111] hover:underline">
            Editorial Methodology ↗
          </Link>
        </div>
      </header>

      {/* Article Body */}
      <div className="prose prose-neutral max-w-none">
        {renderMarkdown(resource.content_markdown)}
      </div>

      {/* Citations & References Section */}
      {resource.citations && resource.citations.length > 0 && (
        <section className="mt-12 pt-6 border-t border-[#E5E5E3]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#111111] mb-3">
            Source Citations &amp; References
          </h2>
          <ol className="list-decimal list-outside ml-4 space-y-2 text-xs text-[#555552]">
            {resource.citations.map((cite, cIdx) => (
              <li key={cIdx} className="leading-relaxed">
                {cite.url ? (
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#111111] hover:underline"
                  >
                    {cite.title} ↗
                  </a>
                ) : (
                  <span className="font-medium text-[#111111]">{cite.title}</span>
                )}
                {cite.publisher && <span className="text-[#888885]"> — {cite.publisher}</span>}
                {cite.date && <span className="text-[#888885]"> ({cite.date})</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Editorial Attribution & Reference Standard Box */}
      <div className="my-10 p-5 border border-[#E5E5E3] bg-[#F8F8F7] text-xs text-[#555552] leading-relaxed">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3] mb-2">
          <span className="font-semibold text-[#111111] uppercase tracking-wider text-[11px]">
            OriginIndex Editorial Governance
          </span>
          <Link to="/methodology" className="text-[11px] font-mono text-[#111111] hover:underline">
            Review Policy ↗
          </Link>
        </div>
        <p className="mb-2">
          OriginIndex publishes independent technical explainers, buyer guides, and infrastructure research across African technology ecosystems. We maintain an independent editorial desk without sponsored placements or affiliate kickbacks.
        </p>
        <p className="text-[11px] text-[#888885]">
          Have a correction, technical challenge, or updated documentation? Submit revisions to our editorial desk for peer review.
        </p>
      </div>

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#E5E5E3]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] mb-4">
            Related Research &amp; Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedResources.map((rel) => (
              <Link
                key={rel.id}
                to="/resources/$slug"
                params={{ slug: rel.slug }}
                className="border border-[#E5E5E3] p-4 bg-white hover:border-[#111111] transition-colors block"
              >
                <div className="text-[10px] font-mono uppercase text-[#888885] mb-1">
                  {rel.category}
                </div>
                <h3 className="font-medium text-xs sm:text-sm text-[#111111] line-clamp-2 leading-snug">
                  {rel.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Footer / Software Submit CTA */}
      <footer className="mt-12 pt-8 border-t border-[#E5E5E3]">
        <div className="bg-[#F8F8F7] border border-[#E5E5E3] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">
              Building or Operating Software in Africa?
            </h3>
            <p className="text-xs text-[#555552] mt-1 max-w-md">
              Submit your software for editorial due diligence, infrastructure classification, and index inclusion.
            </p>
          </div>
          <Link
            to="/submit"
            className="text-xs font-medium px-4 py-2 bg-[#111111] text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            Submit for Review →
          </Link>
        </div>

        <div className="mt-6">
          <Link to="/resources" className="text-xs font-medium text-[#111111] hover:underline inline-flex items-center gap-1">
            ← Back to all Editorial Resources
          </Link>
        </div>
      </footer>
    </article>
  )
}
