import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getActiveCountries, getCategories } from '../lib/supabase'
import { submitProductServerFn } from '../lib/server-submit'
import type { PricingModel } from '../lib/types'
import { buildBreadcrumbJsonLd } from '../lib/seo'
import { TurnstileWidget } from '../components/TurnstileWidget'

export const Route = createFileRoute('/submit')({
  loader: async () => {
    const [countries, categories] = await Promise.all([
      getActiveCountries(),
      getCategories(),
    ])
    return { countries, categories }
  },
  head: () => {
    const title = 'Submit Software to DropYourSaaS | African Discovery Directory'
    const description =
      'Submit an African-built software product for editorial review, classification, and catalogue inclusion. No paid promotion or sponsored placement.'
    const canonical = 'https://dropyoursaas.co.za/submit'

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Submit Software', url: canonical },
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
  component: SubmitPage,
})

const PRICING_OPTIONS: { label: string; value: PricingModel }[] = [
  { label: 'Free (No fee or paid tier)', value: 'free' },
  { label: 'Freemium (Free tier with paid upgrades)', value: 'freemium' },
  { label: 'Free Trial (Time or usage limited trial)', value: 'free_trial' },
  { label: 'Paid Subscription (Monthly or annual billing)', value: 'paid_subscription' },
  { label: 'Usage-Based (Billed on consumption or volume)', value: 'usage_based' },
  { label: 'Contact for Pricing (Enterprise quote only)', value: 'contact_for_pricing' },
]

function SubmitPage() {
  const { countries, categories } = Route.useLoaderData()

  const [formState, setFormState] = useState({
    name: '',
    website_url: '',
    tagline: '',
    description: '',
    category_id: categories[0]?.id || '',
    country_built_id: countries[0]?.id || '',
    countries_served_ids: [countries[0]?.id || ''],
    pricing_model: 'freemium' as PricingModel,
    pricing_details: '',
    submitter_name: '',
    submitter_email: '',
    submitter_relationship: 'founder',
    company_fax: '', // Honeypot field
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0)

  const handleCountryServedToggle = (id: string) => {
    setFormState((prev) => {
      const exists = prev.countries_served_ids.includes(id)
      if (exists) {
        if (prev.countries_served_ids.length === 1) return prev // Keep at least one
        return {
          ...prev,
          countries_served_ids: prev.countries_served_ids.filter((c) => c !== id),
        }
      } else {
        return {
          ...prev,
          countries_served_ids: [...prev.countries_served_ids, id],
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Honeypot check: silently simulate success for automated bots
    if (formState.company_fax.trim() !== '') {
      setIsSubmitting(true)
      setTimeout(() => {
        setIsSubmitting(false)
        setSubmissionSuccess(true)
      }, 500)
      return
    }

    // Validation
    if (!formState.name.trim()) {
      setErrorMessage('Product name is required.')
      return
    }

    let normalizedUrl = formState.website_url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    try {
      new URL(normalizedUrl)
    } catch {
      setErrorMessage('Please enter a valid website URL.')
      return
    }

    if (formState.tagline.length > 100) {
      setErrorMessage('Tagline cannot exceed 100 characters.')
      return
    }

    if (!formState.submitter_email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMessage('Please complete the bot verification challenge before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitProductServerFn({
        data: {
          ...formState,
          turnstile_token: turnstileToken || undefined,
        },
      })
      if (result.success) {
        setSubmissionSuccess(true)
      } else {
        setErrorMessage(result.message || 'Submission could not be completed.')
        setTurnstileResetKey((k) => k + 1)
        setTurnstileToken('')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting. Please try again.')
      setTurnstileResetKey((k) => k + 1)
      setTurnstileToken('')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="border border-neutral-200 bg-neutral-50 p-8 text-left">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Submission Received
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
            Thank you for submitting {formState.name}
          </h1>
          <p className="text-sm text-neutral-700 leading-relaxed mb-6">
            Our editorial team manually verifies domain registration, African engineering origin, and public pricing transparency before staging new candidate entries.
          </p>
          <div className="border-t border-neutral-200 pt-6 flex gap-4">
            <Link
              to="/discover"
              className="px-4 py-2 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-black transition-colors"
            >
              Browse Directory
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(false)
                setFormState({
                  name: '',
                  website_url: '',
                  tagline: '',
                  description: '',
                  category_id: categories[0]?.id || '',
                  country_built_id: countries[0]?.id || '',
                  countries_served_ids: [countries[0]?.id || ''],
                  pricing_model: 'freemium',
                  pricing_details: '',
                  submitter_name: '',
                  submitter_email: '',
                  submitter_relationship: 'founder',
                  company_fax: '',
                })
              }}
              className="px-4 py-2 border border-neutral-300 font-mono text-xs uppercase tracking-wider text-neutral-700 hover:border-black transition-colors"
            >
              Submit Another Product
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">Submit Software</span>
      </nav>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-8 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Submit Software for Indexing
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-2xl leading-relaxed">
          DropYourSaaS is an independent discovery directory. We list software built in African countries or purposefully supporting African payment and compliance rails. Submissions are reviewed individually by our editorial team.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-900 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Anti-spam honeypot */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="company_fax">Leave this field blank</label>
          <input
            id="company_fax"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formState.company_fax}
            onChange={(e) => setFormState({ ...formState, company_fax: e.target.value })}
          />
        </div>

        {/* Section 1: Product Basics */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-200">
            01. Product Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. QuickBridge"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Website URL <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://example.com"
                value={formState.website_url}
                onChange={(e) => setFormState({ ...formState, website_url: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700">
                Tagline <span className="text-red-600">*</span>
              </label>
              <span className="text-xs font-mono text-neutral-400">
                {formState.tagline.length}/100
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Concise single-sentence summary of what the software does"
              value={formState.tagline}
              onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
              Detailed Description <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain the core functionality, target users, and workflow capabilities."
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                value={formState.category_id}
                onChange={(e) => setFormState({ ...formState, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm bg-white focus:border-black focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Engineering Provenance (Country Built) <span className="text-red-600">*</span>
              </label>
              <select
                value={formState.country_built_id}
                onChange={(e) => setFormState({ ...formState, country_built_id: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm bg-white focus:border-black focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.iso_code_2})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-2">
              African Markets Served (Select all that apply) <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {countries.map((c) => {
                const isChecked = formState.countries_served_ids.includes(c.id)
                return (
                  <label
                    key={c.id}
                    className={`flex items-center space-x-2 p-2 border text-xs cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'border-neutral-900 bg-neutral-100 font-medium'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCountryServedToggle(c.id)}
                      className="accent-black"
                    />
                    <span>{c.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Pricing Model */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-200">
            02. Pricing Structure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Pricing Model <span className="text-red-600">*</span>
              </label>
              <select
                value={formState.pricing_model}
                onChange={(e) =>
                  setFormState({ ...formState, pricing_model: e.target.value as PricingModel })
                }
                className="w-full px-3 py-2 border border-neutral-300 text-sm bg-white focus:border-black focus:outline-none"
              >
                {PRICING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Pricing Transparency Details
              </label>
              <input
                type="text"
                placeholder="e.g. Free tier available; Instructor plan R199/mo"
                value={formState.pricing_details}
                onChange={(e) => setFormState({ ...formState, pricing_details: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Submitter Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-200">
            03. Submitter Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Your Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Clive Makazhu"
                value={formState.submitter_name}
                onChange={(e) => setFormState({ ...formState, submitter_name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Contact Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="founder@company.com"
                value={formState.submitter_email}
                onChange={(e) => setFormState({ ...formState, submitter_email: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
                Relationship <span className="text-red-600">*</span>
              </label>
              <select
                value={formState.submitter_relationship}
                onChange={(e) => setFormState({ ...formState, submitter_relationship: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 text-sm bg-white focus:border-black focus:outline-none"
              >
                <option value="founder">Founder / Co-Founder</option>
                <option value="team_member">Team Member</option>
                <option value="user">Active User / Customer</option>
                <option value="community">Community Submitter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Bot & Integrity Verification */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-200">
            04. Bot Verification
          </h2>

          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken('')}
            onError={() => {
              setTurnstileToken('')
              setErrorMessage('Bot verification failed. Please try again.')
            }}
            resetKey={turnstileResetKey}
          />
        </div>

        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 max-w-md">
            Submissions are checked for working HTTPS URLs, active African operations, and verified builder attribution.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Software for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
