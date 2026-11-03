import { createFileRoute, Link } from '@tanstack/react-router'
import { buildBreadcrumbJsonLd } from '../lib/seo'

export const Route = createFileRoute('/methodology')({
  head: () => {
    const title = 'Editorial Methodology, Standards & Governance | OriginIndex'
    const description =
      'Our standards for software verification, publisher conflict disclosures, primary source citations, corrections protocol, and editorial governance.'
    const canonical = 'https://dropyoursaas.co.za/methodology'

    const breadcrumbs = [
      { name: 'Home', url: 'https://dropyoursaas.co.za/' },
      { name: 'Editorial Methodology', url: canonical },
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
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-[#1a1a1a]">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-neutral-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-black transition-colors">Index</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Methodology</span>
      </nav>

      {/* Editorial Header */}
      <header className="border-b border-neutral-200 pb-10 mb-12">
        <div className="text-xs uppercase tracking-widest text-neutral-500 font-mono mb-3">
          OriginIndex Editorial Policy
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-neutral-900 leading-tight">
          Editorial Methodology &amp; Standards
        </h1>
        <p className="mt-4 text-base text-neutral-600 leading-relaxed font-sans">
          How OriginIndex verifies software, conducts technical audits, manages publisher disclosures, and grounds research in primary legal statutes, physical network principles, and traceable evidence.
        </p>
        <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-6 text-xs text-neutral-500 font-sans">
          <div><strong>Publisher &amp; Editor:</strong> Clive Makazhu</div>
          <div><strong>Review Model:</strong> First-party technical walkthroughs</div>
          <div><strong>Published:</strong> November 2026</div>
        </div>
      </header>

      {/* Main Narrative Article */}
      <div className="prose prose-neutral max-w-none text-neutral-800 text-sm leading-relaxed space-y-12 font-sans">
        
        {/* Section 1: Mission & Structure */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            1. Editorial Mission &amp; Publishing Structure
          </h2>
          <p>
            OriginIndex is an independent African software publication and reference index. Our mandate is straightforward: <em>Discover software. Trace its origin.</em>
          </p>
          <p>
            The publication is owned and edited by South African software developer and researcher <strong>Clive Makazhu</strong>. We do not manufacture artificial institutional newsrooms, inflate staff rosters, or claim third-party independence where it does not exist. All technical walkthroughs, verification audits, and research articles are authored and verified directly by Clive Makazhu.
          </p>
          <p>
            Because we operate as an independent technical resource, we adhere to three foundational commercial rules:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-700">
            <li><strong>Zero Sponsored Placements:</strong> Software products cannot purchase inclusion, verification status, or favorable coverage.</li>
            <li><strong>Zero Affiliate Distortion:</strong> We do not participate in payment-processor bounty programs, referral commissions, or affiliate links that distort evaluation.</li>
            <li><strong>Mandatory Affiliation Disclosures:</strong> Any product developed, owned, or commercially associated with the publisher carries a prominent, permanent disclosure on both catalogue summaries and specification sheets.</li>
          </ul>
        </section>

        {/* Section 2: Verification Process */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            2. The Software Verification Framework
          </h2>
          <p>
            Before any software product is listed with verified status on OriginIndex, it undergoes a four-stage technical walkthrough:
          </p>
          <div className="space-y-6 pt-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-1">
                Stage 1: Domain &amp; Network Infrastructure
              </h3>
              <p className="text-neutral-600">
                Point-in-time verification of valid HTTPS/TLS certificate configuration, active DNS records, responsive application endpoints, and server infrastructure behavior across residential and mobile connections.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-1">
                Stage 2: Builder Provenance &amp; Engineering Attribution
              </h3>
              <p className="text-neutral-600">
                Direct attribution to lead architects, engineering teams, and corporate ownership to identify authentic geographic origin, intellectual property custody, and engineering location.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-1">
                Stage 3: Commercial Terms &amp; Settlement Rails
              </h3>
              <p className="text-neutral-600">
                Verification of stated pricing tiers, billing currencies (domestic fiat vs foreign USD/EUR), supported domestic payment rails (e.g. Instant EFT, Capitec Pay, M-Pesa), and cancellation policies against live checkout workflows.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-1">
                Stage 4: Availability Classification
              </h3>
              <p className="text-neutral-600">
                Factual classification under the IndexAfrika availability taxonomy, separating geographic accessibility from payment rails, hosting location, and domestic regulatory obligations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Three-Tier Evidence Model */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            3. The Three-Tier Evidence Standard
          </h2>
          <p>
            To prevent overclaiming, every verification profile on OriginIndex explicitly divides its findings into three distinct evidentiary tiers:
          </p>
          <div className="space-y-5 pt-2">
            <div className="border-l-2 border-neutral-800 pl-4 py-1">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                Tier 1: Directly Observed by OriginIndex (Empirical Verification)
              </h3>
              <p className="text-neutral-600">
                Observations directly documented during technical testing: point-in-time TLS handshakes, client-side packet traces, browser onboarding flows, absence of credential requirements, and tested file transfer sessions. A test is documented as a point-in-time record on a specific date, not an unmeasured claim of permanent uptime or universal reliability.
              </p>
            </div>
            <div className="border-l-2 border-neutral-400 pl-4 py-1">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                Tier 2: Builder-Supplied Evidence &amp; Attestations
              </h3>
              <p className="text-neutral-600">
                Technical claims provided directly by the developer or extracted from published vendor documentation: stated payload capacities (e.g. maximum file size limits), documented fallback architectures, pricing policies, and developer portfolio identities.
              </p>
            </div>
            <div className="border-l-2 border-neutral-300 pl-4 py-1">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                Tier 3: Audit Boundaries &amp; Untested Areas
              </h3>
              <p className="text-neutral-600">
                Explicit declarations of what was not tested. If a product has not undergone an independent third-party cryptographic code review, formal penetration testing, or server-side operating log inspection, we state these boundaries explicitly.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Publisher Conflict Management */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            4. Publisher Affiliation &amp; Conflict Management
          </h2>
          <p>
            We maintain an explicit architectural separation between products submitted by independent founders (<code>is_founder_submitted</code>) and products owned or created by the publisher of OriginIndex (<code>publisher_affiliation</code>).
          </p>
          <p>
            <strong>The Reference Listing:</strong> QuickBridge is developed by Clive Makazhu, Publisher of OriginIndex. It serves as our initial reference implementation to demonstrate our verification rubric. It carries permanent disclosure badges across all directory views.
          </p>
          <p>
            <strong>Staging Isolation:</strong> Other products created by the publisher remain in private draft staging. Only one publisher-affiliated product is listed publicly. Submissions from external founders enter an isolated editorial queue and are never marked as publisher-affiliated.
          </p>
        </section>

        {/* Section 5: Corrections & Retraction Policy */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            5. Corrections, Clarifications &amp; Retractions Protocol
          </h2>
          <p>
            We welcome corrections from software developers, legal practitioners, network engineers, and readers. Our formal process operates as follows:
          </p>
          <div className="space-y-4 pt-2">
            <div>
              <strong className="text-neutral-900 block text-xs uppercase tracking-wider mb-1">
                Receipt &amp; Acknowledgment
              </strong>
              <p className="text-neutral-600">
                Inquiries sent to <span className="font-mono text-neutral-900">editorial@dropyoursaas.co.za</span> are reviewed directly by Clive Makazhu. We target acknowledgment within 24 to 48 business hours.
              </p>
            </div>
            <div>
              <strong className="text-neutral-900 block text-xs uppercase tracking-wider mb-1">
                Primary Evidence Verification
              </strong>
              <p className="text-neutral-600">
                Every disputed assertion is cross-checked against primary sources: official gazetted statutes, published bank pricing guides, IETF RFC standards, manufacturer fiber specifications, or reproducible packet traces.
              </p>
            </div>
            <div>
              <strong className="text-neutral-900 block text-xs uppercase tracking-wider mb-1">
                Changelog &amp; Retractions
              </strong>
              <p className="text-neutral-600">
                When a substantive factual correction is made, a timestamped correction note is appended to the publication. If a core premise is found fundamentally inaccurate, the article is formally retracted with an explanatory statement preserved at its canonical URL.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Research & Citation Standards */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-2">
            6. Research &amp; Citation Standards
          </h2>
          <p>
            To maintain research integrity, OriginIndex enforces strict sourcing rules:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li><strong>Primary Legal Statutes:</strong> Legal citations reference official gazetted legislation with specific section numbers (e.g. South Africa&apos;s POPIA s. 72; Nigeria&apos;s NDPA 2023 ss. 41–43; Kenya&apos;s Data Protection Act 2019 ss. 48–50 and Data Protection (General) Regulations 2021 reg. 46). We avoid describing general transfer rules as blanket data localization mandates.</li>
            <li><strong>Internet &amp; Protocol Standards:</strong> Networking analyses cite active, non-obsolete IETF RFCs (e.g. RFC 8656 for TURN, RFC 8831 for WebRTC Data Channels, RFC 8445 for ICE) and W3C Recommendations.</li>
            <li><strong>Empirical Telemetry &amp; Industry Surveys:</strong> Statistical benchmarks require explicit identification of the research organization, dataset size, and geographical scope (e.g. citing Zylo&apos;s 2022 SaaS Management Index as Western enterprise data rather than African market surveys). We do not invent percentages or general averages.</li>
            <li><strong>Physical Waveguide Constraints:</strong> Latency discussions are grounded in optical physics and manufacturer fiber datasheets (N_eff ≈ 1.468 at 1550 nm), clearly separating theoretical propagation lower bounds from unmeasured operational network latency.</li>
          </ul>
        </section>
      </div>

      {/* Editorial Colophon */}
      <footer className="mt-16 pt-8 border-t border-neutral-200 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div>
          Authored and published by Clive Makazhu, Publisher &amp; Editor of OriginIndex.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/resources" className="text-neutral-800 font-medium hover:underline">
            Editorial Publications &rarr;
          </Link>
          <Link to="/" className="text-neutral-800 font-medium hover:underline">
            Index Home &rarr;
          </Link>
        </div>
      </footer>
    </div>
  )
}
