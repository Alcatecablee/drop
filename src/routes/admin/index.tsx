import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase, getPublishedProducts, getActiveCountries, getCategories } from '../../lib/supabase'
import { INITIAL_CANDIDATE_PRODUCTS } from '../../lib/constants'
import type { ProductWithRelations, Submission, Country, Category, PublicationStatus, VerificationStatus, OperationalStatus } from '../../lib/types'

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [
      { title: 'OriginIndex Editorial Desk & Moderation' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'moderation' | 'catalog'>('moderation')
  const [submissionTab, setSubmissionTab] = useState<'pending' | 'approved' | 'rejected' | 'spam'>('pending')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'draft' | 'published'>('all')

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [products, setProducts] = useState<ProductWithRelations[]>(INITIAL_CANDIDATE_PRODUCTS)
  const [countries, setCountries] = useState<Country[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Check local preview mock session
          const mock = typeof window !== 'undefined' ? sessionStorage.getItem('mock_admin_session') : null
          if (!mock) {
            navigate({ to: '/admin/login' })
            return
          }
          setAdminUser('admin@dropyoursaas.co.za (Offline Preview)')
        } else {
          setAdminUser(session.user.email || 'Admin')
        }
      } else {
        const mock = typeof window !== 'undefined' ? sessionStorage.getItem('mock_admin_session') : null
        if (!mock) {
          navigate({ to: '/admin/login' })
          return
        }
        setAdminUser('Local Preview Mode')
      }

      await loadData()
      setIsLoading(false)
    }

    checkAuth()
  }, [navigate])

  const loadData = async () => {
    try {
      const [fetchedCountries, fetchedCategories] = await Promise.all([
        getActiveCountries(),
        getCategories(),
      ])
      setCountries(fetchedCountries)
      setCategories(fetchedCategories)

      if (supabase) {
        const { data: subData } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false })

        if (subData) {
          setSubmissions(subData as Submission[])
        }

        const { data: prodData } = await supabase
          .from('products')
          .select(`
            *,
            country_built:countries!products_country_built_id_fkey(*),
            category:categories(*),
            countries_served:product_countries_served(
              country:countries(*)
            )
          `)
          .order('name', { ascending: true })

        if (prodData && prodData.length > 0) {
          const formatted: ProductWithRelations[] = prodData.map((p: any) => ({
            ...p,
            countries_served: (p.countries_served || []).map((cs: any) => cs.country).filter(Boolean),
          }))
          setProducts(formatted)
        }
      } else {
        // Fallback mock submissions
        setSubmissions([
          {
            id: 'sub-sample-1',
            product_name: 'PayFlex Africa',
            website_url: 'https://payflex.co.za',
            tagline: 'Buy now pay later for South African online stores',
            description: 'Customer installment payment option for ecommerce merchants with zero interest.',
            category_id: categories[0]?.id || '',
            country_built_id: countries[0]?.id || '',
            countries_served_ids: [countries[0]?.id || ''],
            pricing_model: 'usage_based',
            submitter_name: 'Devin Marks',
            submitter_email: 'devin@payflex.co.za',
            is_founder: true,
            status: 'pending',
            admin_notes: 'Merchant fee per completed order',
            submitted_ip_hash: 'f9a2b8e4...',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
      }
    } catch (e) {
      console.error('Error loading admin data:', e)
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    sessionStorage.removeItem('mock_admin_session')
    navigate({ to: '/admin/login' })
  }

  const handleApproveSubmission = async (sub: Submission) => {
    try {
      if (supabase) {
        // Call secure admin RPC
        const { data: newProductId, error } = await supabase.rpc('approve_submission_to_draft', {
          p_submission_id: sub.id,
        })
        if (error) throw error
        setActionMessage(`Approved "${sub.product_name}". Draft product created (ID: ${newProductId}).`)
      } else {
        // Local preview simulation
        setSubmissions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: 'approved' } : s))
        )
        setActionMessage(`[Preview Mode] Approved "${sub.product_name}" as draft.`)
      }
      loadData()
    } catch (err: any) {
      setActionMessage(`Error approving submission: ${err.message}`)
    }
  }

  const handleRejectSubmission = async (sub: Submission) => {
    const reason = window.prompt('Enter rejection reason (optional):', 'Does not meet African engineering origin criteria')
    if (reason === null) return

    try {
      if (supabase) {
        const { error } = await supabase.rpc('reject_submission', {
          p_submission_id: sub.id,
          p_reason: reason,
        })
        if (error) throw error
      } else {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id ? { ...s, status: 'rejected', admin_notes: reason } : s
          )
        )
      }
      setActionMessage(`Rejected "${sub.product_name}".`)
      loadData()
    } catch (err: any) {
      setActionMessage(`Error rejecting submission: ${err.message}`)
    }
  }

  const handleTogglePublication = async (product: ProductWithRelations) => {
    const nextStatus: PublicationStatus =
      product.publication_status === 'published' ? 'draft' : 'published'

    try {
      if (supabase) {
        const { error } = await supabase
          .from('products')
          .update({ publication_status: nextStatus })
          .eq('id', product.id)

        if (error) throw error
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, publication_status: nextStatus } : p))
      )
      setActionMessage(`Product "${product.name}" set to ${nextStatus}.`)
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    }
  }

  const handleToggleVerification = async (product: ProductWithRelations) => {
    const isNowVerified = product.verification_status !== 'verified'
    const nextVerification: VerificationStatus = isNowVerified ? 'verified' : 'unverified'
    const nextVerifiedAt = isNowVerified ? new Date().toISOString() : null

    try {
      if (supabase) {
        const { error } = await supabase
          .from('products')
          .update({
            verification_status: nextVerification,
            last_verified_at: nextVerifiedAt,
          })
          .eq('id', product.id)

        if (error) throw error
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, verification_status: nextVerification, last_verified_at: nextVerifiedAt }
            : p
        )
      )
      setActionMessage(`Verification for "${product.name}" updated to ${nextVerification}.`)
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    }
  }

  const filteredSubmissions = submissions.filter((s) => s.status === submissionTab)
  const filteredProducts = products.filter((p) => {
    if (catalogFilter === 'draft') return p.publication_status === 'draft'
    if (catalogFilter === 'published') return p.publication_status === 'published'
    return true
  })

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center font-mono text-xs text-neutral-500">
        Loading admin console...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
              Admin Moderation & Catalog Console
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 mt-1">
            DropYourSaaS Operations
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Signed in as: <span className="font-mono font-medium text-neutral-900">{adminUser}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/discover"
            className="px-3 py-1.5 border border-neutral-300 text-xs font-mono uppercase tracking-wider text-neutral-700 hover:border-black transition-colors"
          >
            Public Directory
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider hover:bg-black transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-3 border border-neutral-900 bg-neutral-100 text-neutral-900 text-xs font-mono flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main Mode Tabs */}
      <div className="flex border-b border-neutral-200 mb-8 space-x-8">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 text-sm font-medium tracking-tight border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-neutral-900 text-neutral-950 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Submission Queue ({submissions.filter((s) => s.status === 'pending').length} pending)
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-medium tracking-tight border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-neutral-900 text-neutral-950 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Candidate Catalog ({products.length} records)
        </button>
      </div>

      {/* VIEW 1: SUBMISSIONS MODERATION */}
      {activeTab === 'moderation' && (
        <div>
          {/* Sub tabs */}
          <div className="flex gap-2 mb-6">
            {(['pending', 'approved', 'rejected', 'spam'] as const).map((tab) => {
              const count = submissions.filter((s) => s.status === tab).length
              return (
                <button
                  key={tab}
                  onClick={() => setSubmissionTab(tab)}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                    submissionTab === tab
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {tab} ({count})
                </button>
              )
            })}
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="border border-neutral-200 bg-neutral-50 p-12 text-center text-xs font-mono text-neutral-500">
              No {submissionTab} submissions found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => (
                <div key={sub.id} className="border border-neutral-200 p-6 bg-white">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-neutral-900">{sub.product_name}</h3>
                        <a
                          href={sub.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-neutral-500 underline hover:text-black"
                        >
                          {sub.website_url} &nearr;
                        </a>
                      </div>
                      <p className="text-sm text-neutral-700 mt-1">{sub.tagline}</p>
                    </div>

                    <div className="text-right text-xs font-mono text-neutral-500">
                      <div>Submitted: {new Date(sub.created_at).toLocaleDateString()}</div>
                      <div>Role: {sub.is_founder ? 'Founder' : 'Contributor'}</div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed mb-4 whitespace-pre-wrap">
                    {sub.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-neutral-50 p-3 border border-neutral-100 mb-4">
                    <div>
                      <span className="text-neutral-400 block">Pricing:</span>
                      <span className="text-neutral-800">{sub.pricing_model}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Submitter:</span>
                      <span className="text-neutral-800">{sub.submitter_name}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Email:</span>
                      <span className="text-neutral-800">{sub.submitter_email}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Status:</span>
                      <span className="uppercase font-semibold">{sub.status}</span>
                    </div>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveSubmission(sub)}
                        className="px-4 py-1.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-black"
                      >
                        Approve as Draft Product
                      </button>
                      <button
                        onClick={() => handleRejectSubmission(sub)}
                        className="px-4 py-1.5 border border-neutral-300 text-neutral-700 font-mono text-xs uppercase tracking-wider hover:border-black"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CANDIDATE CATALOG MANAGER */}
      {activeTab === 'catalog' && (
        <div>
          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              {(['all', 'draft', 'published'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCatalogFilter(filter)}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                    catalogFilter === filter
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {filter} (
                  {products.filter((p) => (filter === 'all' ? true : p.publication_status === filter)).length}
                  )
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-neutral-500">
              Total candidates: {products.length}
            </div>
          </div>

          {/* Table */}
          <div className="border border-neutral-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 font-mono uppercase tracking-wider text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Origin</th>
                  <th className="p-3">Pricing</th>
                  <th className="p-3">Publication</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="p-3">
                      <div className="font-sans font-semibold text-neutral-900">{p.name}</div>
                      <a
                        href={p.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-500 hover:text-black truncate max-w-xs block"
                      >
                        {p.website_url}
                      </a>
                    </td>
                    <td className="p-3 text-neutral-700">{p.primary_category?.name || '—'}</td>
                    <td className="p-3 text-neutral-700">
                      {p.country_built?.name} ({p.country_built?.iso_code_2})
                    </td>
                    <td className="p-3 text-neutral-700">{p.pricing_model}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-semibold ${
                          p.publication_status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {p.publication_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-semibold ${
                          p.verification_status === 'verified'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {p.verification_status}
                      </span>
                      {p.last_verified_at && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(p.last_verified_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublication(p)}
                        className="px-2 py-1 border border-neutral-300 hover:border-black text-[11px]"
                      >
                        {p.publication_status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleToggleVerification(p)}
                        className="px-2 py-1 border border-neutral-300 hover:border-black text-[11px]"
                      >
                        {p.verification_status === 'verified' ? 'Mark Unverified' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
