import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getCategories, getPublishedProducts } from '../../lib/supabase'
import { ProductCard } from '../../components/ProductCard'
import { buildBreadcrumbJsonLd } from '../../lib/seo'

export const Route = createFileRoute('/categories/$slug')({
  loader: async ({ params }) => {
    const categories = await getCategories()
    const category = categories.find((c) => c.slug === params.slug)
    if (!category) {
      throw notFound()
    }

    const allProducts = await getPublishedProducts()
    const categoryProducts = allProducts.filter(
      (p) => p.category_id === category.id || p.category?.slug === category.slug
    )

    return {
      category,
      products: categoryProducts,
      allCategories: categories,
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.category) return {}
    const { category } = loaderData
    const title = `${category.meta_title || `${category.name} Software in Africa`} | DropYourSaaS`
    const description =
      category.meta_description ||
      `Explore vetted ${category.name.toLowerCase()} software built across Africa. Compare pricing models, country availability, and technical provenance.`
    const canonical = `https://dropyoursaas.co.za/categories/${category.slug}`

    const breadcrumbs = [
      { name: 'Home', item: 'https://dropyoursaas.co.za/' },
      { name: 'Categories', item: 'https://dropyoursaas.co.za/discover' },
      { name: category.name, item: canonical },
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
  component: CategorySlugPage,
})

function CategorySlugPage() {
  const { category, products, allCategories } = Route.useLoaderData()

  const otherCategories = allCategories
    .filter((c) => c.slug !== category.slug)
    .slice(0, 6)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <Link to="/discover" className="hover:text-black">Categories</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
              {category.name}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
              {category.description || `Software tools and platforms built for ${category.name.toLowerCase()} workflows across African markets.`}
            </p>
          </div>
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider bg-neutral-50 border border-neutral-200 px-3 py-1.5 self-start md:self-auto">
            {products.length} {products.length === 1 ? 'Product Listed' : 'Products Listed'}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="border border-neutral-200 bg-neutral-50 p-12 text-center my-8">
          <p className="text-sm text-neutral-700 font-medium mb-1">
            No published products in this category yet.
          </p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mb-6">
            We vet submissions against physical African provenance and verifiable active URLs before indexing.
          </p>
          <Link
            to="/submit"
            className="inline-block text-xs uppercase tracking-wider px-4 py-2 bg-neutral-900 text-white font-mono hover:bg-black transition-colors"
          >
            Submit a Tool
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Explore Other Categories */}
      <div className="pt-8 border-t border-neutral-200">
        <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-4">
          Other Software Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCategories.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="px-3 py-1.5 border border-neutral-200 text-xs text-neutral-700 hover:border-black hover:text-black transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
