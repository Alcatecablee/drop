import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/login')({
  head: () => ({
    meta: [
      { title: 'OriginIndex Editorial Desk Login' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if already authenticated
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate({ to: '/admin' })
        }
      })
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      if (!supabase) {
        throw new Error('Supabase authentication service is not configured.')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        navigate({ to: '/admin' })
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm border border-neutral-300 p-8 bg-white shadow-none">
        <div className="mb-6 border-b border-neutral-200 pb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
            Internal Access
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mt-1">
            Admin Sign In
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Authentication required to moderate submissions and manage catalog state.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-900 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@dropyoursaas.co.za"
              className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In with Supabase Auth'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-between text-xs text-neutral-500">
          <Link to="/" className="hover:text-black">
            &larr; Return to Directory
          </Link>
          <span className="font-mono">DropYourSaaS Core</span>
        </div>
      </div>
    </div>
  )
}
