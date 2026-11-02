import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import '../styles/globals.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DropYourSaaS – African Software Directory & Buyer Guides' },
      {
        name: 'description',
        content: 'Discover software built in and serving African markets. Compare pricing models, regional availability, payment integrations, and founder provenance.',
      },
      { property: 'og:site_name', content: 'DropYourSaaS' },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23111111%22/></svg>' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <div className="min-h-screen flex flex-col justify-between bg-white text-[#111111]">
        <div>
          <Header />
          <main>
            <Outlet />
          </main>
        </div>
        <Footer />
      </div>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
