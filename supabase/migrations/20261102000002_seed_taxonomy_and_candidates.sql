-- ============================================================================
-- DROP YOUR SAAS - MIGRATION 2: TAXONOMY & 20 RESEARCH-QUALIFIED CANDIDATES (DRAFTS)
-- Execution Date: November 2026
-- Blueprint Reference: MVP Implementation Specification v1.2 Locked
-- ============================================================================

-- 1. Insert 5 Active Countries
INSERT INTO public.countries (name, slug, iso_code_2, currency_code, flag_emoji, meta_title, meta_description, display_order)
VALUES
    ('South Africa', 'south-africa', 'ZA', 'ZAR', '🇿🇦', 'Software Built & Supported in South Africa | DropYourSaaS', 'Discover software products built in South Africa or supporting South African payment systems and business compliance.', 1),
    ('Nigeria', 'nigeria', 'NG', 'NGN', '🇳🇬', 'Software Built & Supported in Nigeria | DropYourSaaS', 'Explore software built by Nigerian engineering teams and tools supporting Nigerian merchants and consumers.', 2),
    ('Kenya', 'kenya', 'KE', 'KES', '🇰🇪', 'Software Built & Supported in Kenya | DropYourSaaS', 'Directory of software built in Kenya and applications with native M-Pesa, KES, and East African market integrations.', 3),
    ('Egypt', 'egypt', 'EG', 'EGP', '🇪🇬', 'Software Built & Supported in Egypt | DropYourSaaS', 'Explore engineering tools, mobile SDKs, and cloud platforms built in Egypt and North Africa.', 4),
    ('Ghana', 'ghana', 'GH', 'GHS', '🇬🇭', 'Software Built & Supported in Ghana | DropYourSaaS', 'Discover commerce, payments, and digital communications software built in Ghana and serving West Africa.', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert 9 Core Categories
INSERT INTO public.categories (name, slug, description, meta_title, meta_description, display_order)
VALUES
    ('Developer Tools & Infrastructure', 'developer-tools', 'Developer utilities, SDKs, AST linters, testing frameworks, and cloud infrastructure.', 'Developer Tools & Infrastructure in Africa | DropYourSaaS', 'Explore developer tools, CLIs, APIs, and devops infrastructure built by African software teams.', 1),
    ('Payments & Financial Infrastructure', 'payments-fintech', 'Payment gateways, open banking APIs, merchant checkouts, and point-of-sale software.', 'Payments & FinTech Software in Africa | DropYourSaaS', 'Compare verified payment gateways, Instant EFT solutions, and open banking APIs across Africa.', 2),
    ('HR & Payroll', 'hr-payroll', 'Workforce management, compliance payroll, digital payslips, and Employer of Record platforms.', 'HRTech & Payroll Software in Africa | DropYourSaaS', 'Discover African HRMS, automated multi-currency payroll, and frontline workforce tools.', 3),
    ('Communications & Messaging APIs', 'communications-apis', 'SMS, WhatsApp, USSD, voice telecommunications, and OTP delivery APIs.', 'Communications & Telecom APIs in Africa | DropYourSaaS', 'Developer communications APIs for two-way SMS, USSD menus, WhatsApp OTPs, and airtime rails.', 4),
    ('AI & Data', 'ai-data', 'Machine learning platforms, data pipelines, document processing, and generative intelligence.', 'AI & Data Software in Africa | DropYourSaaS', 'Explore artificial intelligence applications, document intelligence, and data analytics tools.', 5),
    ('Productivity & Creative Tools', 'productivity-tools', 'Browser-native utilities, local-first media tools, and computer diagnostics.', 'Productivity & Utility Software in Africa | DropYourSaaS', 'Privacy-first browser utilities, local-first video editing, and troubleshooting tools.', 6),
    ('Education & Training', 'education-tech', 'Exam simulators, learning management systems, and driver test prep platforms.', 'Education Technology in Africa | DropYourSaaS', 'Discover online learning platforms, test preparation software, and instructional simulators.', 7),
    ('Marketing, Sales & CRM', 'marketing-crm', 'Social commerce, customer relationship management, and sales enablement tools.', 'Marketing & CRM Software in Africa | DropYourSaaS', 'Explore CRM tools, conversational commerce on WhatsApp, and merchant sales platforms.', 8),
    ('Business Operations & Vertical SaaS', 'business-operations', 'Industry-specific software, single exit price medicine lookup, and governance suites.', 'Business Operations & Vertical SaaS in Africa | DropYourSaaS', 'Vertical software for healthcare pricing, governance, risk management, and retail operations.', 9)
ON CONFLICT (slug) DO NOTHING;

-- 3. Staging 20 Research-Qualified Candidates (Strictly Unverified Drafts)
DO $$
DECLARE
    -- Country IDs
    c_za UUID;
    c_ng UUID;
    c_ke UUID;
    c_eg UUID;
    c_gh UUID;

    -- Category IDs
    cat_dev UUID;
    cat_fin UUID;
    cat_hr UUID;
    cat_comm UUID;
    cat_ai UUID;
    cat_prod UUID;
    cat_edu UUID;
    cat_mkt UUID;
    cat_ops UUID;

    -- Product IDs
    p_id UUID;
BEGIN
    SELECT id INTO c_za FROM public.countries WHERE slug = 'south-africa';
    SELECT id INTO c_ng FROM public.countries WHERE slug = 'nigeria';
    SELECT id INTO c_ke FROM public.countries WHERE slug = 'kenya';
    SELECT id INTO c_eg FROM public.countries WHERE slug = 'egypt';
    SELECT id INTO c_gh FROM public.countries WHERE slug = 'ghana';

    SELECT id INTO cat_dev FROM public.categories WHERE slug = 'developer-tools';
    SELECT id INTO cat_fin FROM public.categories WHERE slug = 'payments-fintech';
    SELECT id INTO cat_hr FROM public.categories WHERE slug = 'hr-payroll';
    SELECT id INTO cat_comm FROM public.categories WHERE slug = 'communications-apis';
    SELECT id INTO cat_ai FROM public.categories WHERE slug = 'ai-data';
    SELECT id INTO cat_prod FROM public.categories WHERE slug = 'productivity-tools';
    SELECT id INTO cat_edu FROM public.categories WHERE slug = 'education-tech';
    SELECT id INTO cat_mkt FROM public.categories WHERE slug = 'marketing-crm';
    SELECT id INTO cat_ops FROM public.categories WHERE slug = 'business-operations';

    -- 1. QuickBridge
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'QuickBridge', 'quickbridge',
        'Privacy-first, browser-native P2P file sharing via WebRTC without accounts or installs.',
        'QuickBridge is a browser-native peer-to-peer data and file transfer utility built for direct, encrypted transmission between devices. Files, text, and clipboard items travel over WebRTC data channels directly between sender and receiver without uploading to intermediary cloud storage servers. No accounts, logins, or native app installations are required.',
        'https://quickbridge.app', cat_dev, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'free', 'Free',
        'Completely free with no transfer quotas or subscription tiers.', 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za), (p_id, c_ng), (p_id, c_ke), (p_id, c_eg), (p_id, c_gh);

    -- 2. NeuroLint
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, is_open_source, github_url, publication_status, verification_status, operational_status
    ) VALUES (
        'NeuroLint', 'neurolint',
        'AST-first code analysis & automated remediation engine for React and TypeScript codebases.',
        'NeuroLint (@neurolint/cli) is an open-source command-line code remediation engine designed for React, Next.js, and TypeScript developers. Rather than relying on non-deterministic LLM generations, NeuroLint applies deterministic Abstract Syntax Tree (AST) parsing rules to automatically detect, explain, and patch common hydration errors, breaking framework changes, and syntax migrations.',
        'https://neurolint.dev', cat_dev, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'free', 'Free',
        'Core command-line interface (@neurolint/cli) is completely free and open-source.', 'CLI', true, 'https://github.com/Alcatecablee/neurolint-cli', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za), (p_id, c_ng), (p_id, c_ke), (p_id, c_eg), (p_id, c_gh);

    -- 3. Pillbig
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Pillbig', 'pillbig',
        'South African Single Exit Price (SEP) medicine intelligence and generic alternative search.',
        'Pillbig is a healthcare transparency tool engineered to make South African pharmaceutical pricing clear and accessible. It allows patients, pharmacists, and medical practices to search registered medications by trade name, active ingredient, or NAPPI code to inspect official Single Exit Prices (SEP) and discover bioequivalent generic alternatives.',
        'https://pillbig.co.za', cat_ops, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'free', 'Free',
        'Free medicine price search and generic alternative discovery.', 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 4. CalmPC
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'CalmPC', 'calmpc',
        'Browser-based client-side computer health diagnostics and plain-language troubleshooting guides.',
        'CalmPC is a lightweight browser utility that helps non-technical users diagnose PC issues, sluggish performance, and device health without downloading untrusted software. Diagnostics run client-side and pair findings with step-by-step plain-language fix instructions.',
        'https://calmpc.com', cat_prod, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'free', 'Free',
        'Free browser-based diagnostic guides.', 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za), (p_id, c_ng), (p_id, c_ke), (p_id, c_eg), (p_id, c_gh);

    -- 5. SuperK53
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'SuperK53', 'superk53',
        'South African K53 computerised learner''s licence exam simulator and driving school management tools.',
        'SuperK53 simulates the Computer-Centred Learner''s Licence Test (CLLT) administered at South African Driving Licence Testing Centres (DLTC). It tests rules of the road, road signs, and vehicle controls with adaptive feedback. In addition to free practice for student drivers, SuperK53 offers dedicated portals for driving schools and instructors.',
        'https://superk53.co.za', cat_edu, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'freemium', 'Free for learners; R199/mo Instructor Portal',
        'Learner test simulation is free. The Instructor Portal is priced at R199/month, with fleet and school plans marked coming soon.', 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 6. CalmClip
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_url, is_founder_submitted, pricing_model, starting_price_display,
        pricing_details, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'CalmClip', 'calmclip',
        'Local-first browser video editor powered by WebCodecs and WebAssembly with zero server uploads.',
        'CalmClip is a privacy-first video editing web application. Video rendering, clipping, and transcoding take place entirely inside the browser using WebAssembly and WebCodecs. Source video footage never touches a remote server, delivering instantaneous exports and total privacy for creators.',
        'https://calmclip.video', cat_prod, c_za,
        'Clive Makazhu', 'https://justc.live', true, 'freemium', 'Free / Pro Tiers',
        'Core local-first video trimmer and processor is free; advanced features packaged in Pro.', 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za), (p_id, c_ng), (p_id, c_ke), (p_id, c_eg), (p_id, c_gh);

    -- 7. Paystack
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Paystack', 'paystack',
        'Modern payment processing for African businesses supporting cards, bank transfers, USSD, and mobile money.',
        'Paystack is a leading payment gateway enabling merchants across Nigeria, South Africa, Ghana, Kenya, and Côte d''Ivoire to accept payments online and in-person. It provides developer APIs, pre-built checkout modals, automated payout schedules, recurring billing, and virtual account generation.',
        'https://paystack.com', cat_fin, c_ng,
        'Shola Akinlade, Ezra Olubi', '@paystack', 'usage_based', 'From 1.5% + NGN 100 / 2.9% + R1.00',
        'Transaction-based fee structure: NG: 1.5% + NGN 100 (capped at NGN 2,000); ZA: 2.9% + R1.00 for cards, 2.0% for Instant EFT; GH: 1.95%; KE: 1.5% for M-Pesa, 2.9% for cards.',
        ARRAY['Cards', 'Bank Transfer', 'Capitec Pay', 'Ozow', 'SnapScan', 'M-Pesa', 'MTN MoMo', 'USSD'], 'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ng), (p_id, c_za), (p_id, c_gh), (p_id, c_ke);

    -- 8. Flutterwave
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Flutterwave', 'flutterwave',
        'Pan-African cross-border payment acceptance, payouts, and financial treasury orchestration.',
        'Flutterwave connects African businesses to the global digital economy. It provides merchant checkout infrastructure, multi-currency wallets, virtual cards, batch disbursements, and payment rails connecting cards, bank transfers, and mobile money systems across 30+ African countries.',
        'https://flutterwave.com', cat_fin, c_ng,
        'Olugbenga Agboola', '@theflutterwave', 'usage_based', 'From 2.0% local collections',
        'Collection fees vary by country: Nigeria 2.0%, Kenya 2.9%–3.2%, South Africa 2.9% + R1.00, Ghana 2.0%–2.6%. International cards at 4.8%.',
        ARRAY['Cards', 'Mobile Money', 'Bank Transfer', 'M-Pesa', 'Instant EFT', 'Apple Pay'], 'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ng), (p_id, c_ke), (p_id, c_za), (p_id, c_gh), (p_id, c_eg);

    -- 9. Yoco
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Yoco', 'yoco',
        'Point of sale terminals, payment links, and online checkout software for South African SMEs.',
        'Yoco empowers small and growing businesses across South Africa with financial tools to accept card payments. While known for mobile card machines, Yoco provides an online payment gateway, customizable payment links, e-commerce plugins (WooCommerce, Shopify, Wix), and business analytics.',
        'https://yoco.com', cat_fin, c_za,
        'Katlego Maphai, Carl Wazen, Lungisa Matshoba, Bradley Wattrus', '@Yoco_ZA', 'usage_based', 'From 2.95% + R2.00 online',
        'No monthly subscription fees on Yoco Core. Online payment fees start at 2.95% + R2.00 (excl. VAT) for local card transactions.',
        ARRAY['Visa', 'Mastercard', 'Instant EFT', 'Apple Pay'], 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 10. Ozow
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Ozow', 'ozow',
        'Automated bank-to-bank Instant EFT, PayShap, and card payment gateway for South African merchants.',
        'Ozow is an open-banking payment gateway facilitating instant bank transfers directly from consumer bank accounts. By connecting with South Africa''s major retail banks, Ozow enables secure, cardless digital payments without requiring bank cards, alongside native support for PayShap and credit cards.',
        'https://ozow.com', cat_fin, c_za,
        'Thomas Pays, Mitchan Adams, Lyle Eckstein', '@OzowPay', 'usage_based', 'From 1.5% Instant EFT',
        'Pay by Bank (Instant EFT) starts at 1.5% (minimum R1.00, excl. VAT). Local card processing tiered from 2.65% to 2.85% based on volume.',
        ARRAY['Instant EFT', 'Capitec Pay', 'PayShap', 'Visa', 'Mastercard'], 'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 11. Peach Payments
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Peach Payments', 'peach-payments',
        'Enterprise payment orchestration and multi-method checkout gateway across Southern and East Africa.',
        'Peach Payments provides high-volume digital checkout solutions for mid-market and enterprise merchants in South Africa, Kenya, and Mauritius. It aggregates international cards, local payment methods (PayShap, Capitec Pay, M-Pesa, 1Voucher), and Buy Now Pay Later (BNPL) providers into a unified merchant platform.',
        'https://peachpayments.com', cat_fin, c_za,
        'Rahul Jain, Andreas Demleitner', '@PeachPayments', 'contact_for_pricing', 'Custom transaction rates',
        'Custom transaction fees tailored to merchant business volume, risk profile, and chosen payment methods.',
        ARRAY['Cards', 'PayShap', 'Capitec Pay', 'M-Pesa', 'Payflex', 'Apple Pay'], 'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za), (p_id, c_ke);

    -- 12. Stitch
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Stitch', 'stitch',
        'Payment infrastructure and financial API for Pay-by-Bank, cards, automated payouts, and orchestration.',
        'Stitch is a South African financial infrastructure platform that unifies pay-ins, payouts, and reconciliation. It enables businesses to accept direct bank payments (Pay-by-Bank via Capitec Pay and direct API integrations), process credit cards, and automate bulk payouts with custom routing logic.',
        'https://stitch.money', cat_fin, c_za,
        'Kiaan Pillay, Junaid Dadan, Priyen Pillay, Natalie Cuthbert', '@stitch_money', 'contact_for_pricing', 'Custom volume rates',
        'Tiered pricing tailored between Express out-of-the-box self-service tools and Enterprise payment routing orchestration.',
        ARRAY['Capitec Pay', 'Pay-by-Bank', 'Cards', 'Direct Debit', 'Payouts'], 'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 13. Mono
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Mono', 'mono',
        'Open-banking API connecting African customer bank accounts for data, identity verification, and DirectPay.',
        'Mono enables businesses to securely access customer financial data and initiate direct bank-to-bank payments. Built for fintechs, lenders, and telcos in Nigeria, Ghana, and Kenya, Mono provides real-time bank statement access, identity verification, and account balance telemetry.',
        'https://mono.co', cat_fin, c_ng,
        'Abdulhamid Hassan, Prakhar Singh', '@monohq', 'paid_subscription', 'From NGN 50,000/mo + API usage',
        'Free developer sandbox mode. Paid starter data and lookup tiers start around NGN 50,000/month, scaling to custom volume pricing for enterprise DirectPay integrations.',
        'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ng), (p_id, c_gh), (p_id, c_ke);

    -- 14. Workpay
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Workpay', 'workpay',
        'Pan-African cloud HR, multi-country payroll compliance, and Employer of Record software.',
        'Workpay is an all-in-one HR and payroll platform that allows companies to hire, manage, and pay team members across 35+ African countries. It automates local statutory compliance, tax deductions, employee benefits, and cross-border disbursements into bank accounts and mobile money wallets.',
        'https://myworkpay.com', cat_hr, c_ke,
        'Paul Kimani, Jackson Kibigo', '@myworkpay', 'paid_subscription', 'From USD 5/employee/mo',
        'Transparent tiered pricing: Self-service Payroll & HR starts at USD 5 per employee/month; Outsourced Payroll at USD 25 per employee/month; Employer of Record (EOR) at USD 299 per employee/month.',
        'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ke), (p_id, c_ng), (p_id, c_za), (p_id, c_gh), (p_id, c_eg);

    -- 15. SeamlessHR
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'SeamlessHR', 'seamlesshr',
        'Enterprise HRMS, performance management, and localized payroll automation for African institutions.',
        'SeamlessHR is an enterprise human resources software suite designed specifically for African regulatory environments. It covers the full employee lifecycle: applicant tracking, onboarding, time & attendance, performance appraisals, multi-country payroll, and financial wellness.',
        'https://seamlesshr.com', cat_hr, c_ng,
        'Emmanuel Okeleji, Deji Lana', '@SeamlessHR', 'contact_for_pricing', 'Modular enterprise quote',
        'Modular plans (Lite, Core, Advantage, Custom) custom-quoted based on enterprise headcount and selected platform modules.',
        'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ng), (p_id, c_ke), (p_id, c_gh), (p_id, c_za);

    -- 16. Jem HR
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Jem HR', 'jem-hr',
        'Frontline worker HR, digital payslips, leave management, and earned wage access via WhatsApp.',
        'Jem (formerly SmartWage) delivers essential human resources services to deskless and frontline workers across South Africa through WhatsApp. Employees receive digital payslips, apply for leave, complete HR requests, and access earned wages without requiring dedicated corporate email addresses.',
        'https://jemhr.com', cat_hr, c_za,
        'Simon Ellis, Caroline van der Merwe', '@Jem_SouthAfrica', 'contact_for_pricing', 'Tiered headcount plans',
        'Enterprise plans (Feature, Standard, Comprehensive) priced based on workforce headcount and embedded benefits packages.',
        'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_za);

    -- 17. Termii
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Termii', 'termii',
        'Multi-channel customer engagement, SMS notification, and OTP verification API platform.',
        'Termii provides communications infrastructure that powers user verification, transactional alerts, and customer engagement for African technology companies and banks. Its developer APIs deliver SMS, WhatsApp notifications, voice OTPs, and email across 190+ countries with optimized routing for African telecom networks.',
        'https://termii.com', cat_comm, c_ng,
        'Emmanuel Gbolade, Ayomide Awe, Atinuke Idowu', '@termiihq', 'usage_based', 'Pay-as-you-go per message',
        'Pay-as-you-go digital wallet billed per message route. WhatsApp Business Account available as a dedicated add-on from ~USD 50/month.',
        'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ng), (p_id, c_gh), (p_id, c_ke), (p_id, c_za), (p_id, c_eg);

    -- 18. Africa's Talking
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Africa''s Talking', 'africas-talking',
        'Telecom developer APIs for two-way SMS, USSD sessions, voice calls, and airtime distribution across Africa.',
        'Africa''s Talking provides a unified API platform enabling developers to integrate telecom services into software. Operating across 20+ African countries, the platform supports bulk and interactive SMS, USSD shortcodes, cloud telephony, mobile data bundles, and airtime distribution.',
        'https://africastalking.com', cat_comm, c_ke,
        'Samuel Gikandi, Eston Kimani', '@AfricasTalking', 'usage_based', 'Prepaid usage + free sandbox',
        'Free developer sandbox for testing. Production billed on prepaid pay-as-you-go units per SMS sent, USSD session initiated, or voice minute used.',
        'API', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_ke), (p_id, c_ng), (p_id, c_za), (p_id, c_gh);

    -- 19. Luciq (formerly Instabug)
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Luciq', 'luciq',
        'Agentic mobile observability, autonomous crash reporting, and app performance monitoring SDK.',
        'Founded in Cairo as Instabug and rebranded to Luciq in September 2025, the platform is an AI-native mobile observability solution. It monitors crashes, network latency, app hangs, and bug reports across iOS, Android, React Native, and Flutter, deploying autonomous AI agents to diagnose and propose code-level fixes.',
        'https://luciq.ai', cat_dev, c_eg,
        'Omar Gabr, Moataz Soliman', '@LuciqAI', 'contact_for_pricing', 'Custom enterprise plans',
        'Enterprise pricing tailored to monthly active users (MAU), session volumes, and team seats.',
        'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_eg), (p_id, c_za), (p_id, c_ng), (p_id, c_ke), (p_id, c_gh);

    -- 20. Hubtel
    INSERT INTO public.products (
        name, slug, tagline, description, website_url, primary_category_id, country_built_id,
        builder_name, builder_twitter, pricing_model, starting_price_display, pricing_details,
        supported_payment_gateways, platform_type, publication_status, verification_status, operational_status
    ) VALUES (
        'Hubtel', 'hubtel',
        'Commerce checkouts, mobile money payment aggregation, and POS software for Ghanaian merchants.',
        'Hubtel is one of Ghana''s primary fintech and digital commerce platforms. For businesses, Hubtel provides checkout APIs for e-commerce, mobile money and card collection rails, point-of-sale software for retail storefronts, and high-throughput bulk SMS messaging.',
        'https://hubtel.com', cat_fin, c_gh,
        'Alex Bram, Ernest Apenteng', '@Hubtel', 'usage_based', 'Merchant checkout % & SMS unit fees',
        'Percentage-based merchant service charge on payment collection transactions; metered SMS unit pricing.',
        ARRAY['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Visa', 'Mastercard'], 'Web App', 'draft', 'unverified', 'active'
    ) RETURNING id INTO p_id;
    INSERT INTO public.product_countries_served (product_id, country_id) VALUES (p_id, c_gh);

END $$;
