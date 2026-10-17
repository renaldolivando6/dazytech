import type { SiteCopy } from './id';

// English copy, served at /en/. Same shape as id.ts (checked by TypeScript).
// App illustrations stay in Indonesian: they depict software for Indonesian businesses.

export const en: SiteCopy = {
  locale: 'en',
  path: '/en/',

  meta: {
    title: 'Custom ERP & Business Application Development in Jakarta | Dazytech Solutions',
    description:
      'Jakarta software house building web-based ERP and business applications around the way your company works. Company profile websites from Rp500,000.',
  },

  nav: {
    links: [
      { href: '#contoh', label: 'ERP examples' },
      { href: '#layanan', label: 'Services' },
      { href: '#website', label: 'Websites' },
      { href: '#proses', label: 'How we work' },
      { href: '#faq', label: 'FAQ' },
    ],
    cta: 'Contact us',
    articles: 'Articles',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    home: 'Dazytech home',
    latestArticles: 'Latest articles (in Indonesian)',
    noArticles: 'The first article is coming soon.',
    allArticles: 'All articles ›',
    whatsapp: 'Chat on WhatsApp',
    switchTo: { href: '/', short: 'ID', label: 'Bahasa Indonesia' },
    products: {
      title: 'Dazytech products',
      soon: 'Coming soon',
      items: [
        { name: 'BuatCV', description: 'Free CV builder with an ATS-friendly Harvard format (in Indonesian).', href: 'https://buatcv.dazytech.web.id/' },
        { name: 'OTP Nusantara', description: '', href: null },
      ],
    },
  },

  wa: {
    erp: "Hi Dazytech, I'd like to discuss an ERP / business application project.",
    website: "Hi Dazytech, I'm interested in a company profile website.",
    general: "Hi Dazytech, I'd like a consultation.",
  },

  hero: {
    eyebrow: 'Custom ERP & business applications',
    title: 'Software that follows the way your business works.',
    lead: 'We build ERP and business applications around the way your company works. We start with the module you need most, then grow it step by step.',
    note: 'The first discussion is free. Tell us which process you want to sort out.',
    primary: 'Chat on WhatsApp',
    secondary: 'See ERP workflows',
    proof: 'Hands-on experience building end-to-end web ERP in a corporate environment.',
    websiteQuestion: 'Need a company profile website?',
    websiteLink: 'See website services ›',
    modelLabel: 'The Dazytech mascot in 3D',
  },

  flow: {
    label: 'Illustration: one order connected from sales to invoicing',
    order: 'SO-2026-0142',
    customer: 'Toko Sumber Rejeki',
    summary: '3 items · 16 Oct 2026',
    amount: 'Rp18.4M',
    steps: [
      { module: 'Sales', status: 'Order confirmed', detail: 'Customer credit limit still available', time: '09:12', state: 'done' },
      { module: 'Warehouse', status: 'Stock allocated', detail: 'Cikarang warehouse · 3 of 3 items', time: '10:05', state: 'done' },
      { module: 'Delivery', status: 'On the way', detail: 'DO-0388 · B 9124 KXT · ETA ±14:20', time: '13:40', state: 'current' },
      { module: 'Finance', status: 'Invoice pending', detail: 'INV-0291 is issued once goods are received', time: '', state: 'pending' },
    ],
  },

  services: {
    title: 'Services & pricing',
    erp: {
      tag: 'Core expertise',
      name: 'ERP & business applications',
      price: 'Priced by scope',
      description: 'Connect sales, stock, and finance to cut re-entry and time spent on recaps.',
      items: ['Sales, purchasing, stock & warehouse', 'Finance, HR & payroll', 'Accurate, API & WhatsApp integration', 'Migration from legacy desktop software'],
      note: 'Priced from the modules and integrations you need, agreed before work starts.',
      cta: 'Chat on WhatsApp',
    },
    website: {
      name: 'Company profile website',
      prefix: 'From',
      price: 'Rp500,000',
      description: 'Have a website of your own. Show your services, location, and contact details in one link that is easy to share.',
      items: ['Responsive on phone & desktop', 'WhatsApp button & Google Maps', 'Basic SEO'],
      scope: [],
      scopeNote: 'Pages, revisions, domain, and hosting are discussed during the consultation.',
      cta: 'Ask about websites',
      secondary: 'See example websites ›',
    },
  },

  showcase: {
    title: 'Workflows inside an ERP.',
    tablistLabel: 'Example workflows',
    demo: {
      steps: ['Order created', 'Stock allocated', 'Shipped', 'Invoiced'],
      next: 'Next step',
      restart: 'Start over',
      hint: 'Step through the order and watch stock, delivery, and invoicing change.',
    },
    items: [
      {
        key: 'erp',
        name: 'ERP',
        title: 'One order, visible to every department.',
        body: 'When an order is entered, the system checks stock. The same data flows on to the warehouse, delivery, and invoicing with no re-entry.',
        features: ['Stock allocated when the order is confirmed', 'Delivery note and invoice from the same document', 'Customer credit limit monitored'],
        story: '',
      },
      {
        key: 'inventory',
        name: 'Warehouse',
        title: 'Know what is available before an order is processed.',
        body: 'See physical stock, stock already allocated to orders, and what is truly available in every warehouse.',
        features: ['Movement history per item', 'Minimum stock & purchase suggestions', 'Transfers between warehouses'],
        story: '146 cartons on hand, 60 already allocated to SO-2026-0142, so 86 cartons can still be sold.',
      },
      {
        key: 'pos',
        name: 'POS',
        title: 'Every sale updates the stock right away.',
        body: 'Cashiers record the sale, store stock goes down with it, and the daily report is ready without manual recaps.',
        features: ['Multiple branches & cashiers', 'Record cash, QRIS, and bank transfer payments', 'Daily sales reports'],
        story: 'Sale #TS-2041 at Toko Sumber Rejeki reduces store stock right away: cooking oil goes from 24 to 22.',
      },
      {
        key: 'crm',
        name: 'CRM',
        title: 'Your sales team knows who to contact today.',
        body: 'Every prospect has a stage, an activity history, and a next action. Pipeline value is visible without waiting for a recap.',
        features: ['Follow-up reminders', 'Visit & quotation history', 'Sales targets and commissions'],
        story: 'Minimarket Sejahtera is at the quotation stage, with the next call scheduled today at 14:00.',
      },
      {
        key: 'hris',
        name: 'Payroll',
        title: 'Approved overtime flows straight into payroll.',
        body: 'Attendance, leave, and overtime are connected to payroll. Pay components follow your company rules.',
        features: ['GPS & selfie attendance', 'Multi-level leave & overtime approval', 'Digital payslips'],
        story: 'Six hours of overtime approved by the warehouse head appear on the October payslip as Rp315,600.',
      },
    ],
  },

  websites: {
    title: 'Example company profile websites.',
    lead: 'Two website concepts for different kinds of business.',
    concepts: [
      { key: 'distributor', name: 'Distributor & product catalog', description: 'Help wholesale buyers find products and request a price list.' },
      { key: 'service', name: 'Service business', description: 'Explain the services and guide prospects to request a quote.' },
    ],
    cta: 'Ask about websites',
  },

  experience: {
    title: 'The experience behind Dazytech.',
    body: 'Dazytech was founded by a software engineer who has built end-to-end web ERP applications inside a group of companies, from understanding how work is done in the field to keeping the servers running.',
    items: [
      { title: 'Operational apps from scratch', body: 'Paper-based processes moved into a system: work plans, daily reports, multi-level approvals, and wage calculation.' },
      { title: 'Finance modules', body: 'Journals, general ledger, trial balance, and month-end closing, including an API so other systems can post transactions.' },
      { title: 'Legacy migration', body: 'Old desktop applications moved to web and mobile in stages, running side by side without stopping operations.' },
      { title: 'Servers & maintenance', body: 'Docker, automated deployment, monitoring, and daily backups, so applications stay stable after launch.' },
    ],
    techTitle: 'Technology chosen to fit the project',
    tech: ['Laravel', 'Next.js', 'React', 'Flutter', 'Spring Boot', 'MySQL', 'SQL Server', 'Docker', 'AWS'],
  },

  process: {
    title: 'How we work.',
    steps: [
      { title: 'Understand the need', body: 'We talk through your processes, pain points, and which features come first.' },
      { title: 'Agree on scope', body: 'Features, cost, and schedule are agreed before development starts. Extra requests are assessed for impact before any work begins.' },
      { title: 'Build in stages', body: 'You review the results and give feedback at agreed milestones.' },
      { title: 'Launch & support', body: 'We help with installation and support your team through the first weeks of use.' },
    ],
  },

  faq: {
    title: 'Frequently asked questions.',
    items: [
      {
        q: 'How much does an ERP or business application cost?',
        a: 'Pricing depends on the modules and integrations you need. Scope, cost estimate, and schedule are discussed before development starts, so you know the number before you decide.',
      },
      {
        q: 'What is included in a company profile website from Rp500,000?',
        a: 'The base package covers a responsive layout for phone and desktop, a WhatsApp button, Google Maps, and basic SEO. Number of pages, revisions, domain, and hosting are explained during the consultation.',
      },
      {
        q: 'How long does it take?',
        a: 'A company profile website depends on the number of pages and how ready your materials are (copy, photos, logo). Custom applications usually take 2–5 months depending on the number of modules. We build in stages, so you can review results before the whole system is finished.',
      },
      {
        q: 'We still use an old desktop application. Can it move to the web?',
        a: 'Yes. We study and keep the business rules already in place, then run the new modules alongside the old system until they are ready to replace it.',
      },
      {
        q: 'Can it connect to the systems we already use?',
        a: 'Yes. A new application can be connected to existing systems, such as Accurate, other accounting software, or third-party APIs, so you do not have to replace everything at once.',
      },
      {
        q: 'Do you use WordPress or templates?',
        a: 'No. Websites and applications are built with frameworks such as Laravel and Next.js, without ready-made themes. Layout and workflow follow the requirements we agree on.',
      },
      {
        q: 'What support do you provide after launch?',
        a: 'We help with installation and early use. Fixes, adjustments, and further development are arranged according to the project agreement.',
      },
      {
        q: 'Is the consultation free?',
        a: 'The initial discussion to understand your needs and decide the next step is free, with no obligation to continue with a project.',
      },
    ],
  },

  contact: {
    title: 'Tell us about your business.',
    body: "No feature list yet? That's fine. Tell us how the work is done today and which part you want to improve.",
    whatsappLabel: 'WhatsApp',
    emailLabel: 'Email',
    officeLabel: 'Office',
    form: {
      name: 'Name',
      contact: 'WhatsApp or email',
      contactPlaceholder: '+62 8xx or name@company.com',
      service: 'What do you need?',
      services: [
        { value: 'ERP & aplikasi bisnis', label: 'ERP & business applications' },
        { value: 'Website company profile', label: 'Company profile website' },
        { value: 'Integrasi / migrasi sistem lama', label: 'Integration / legacy migration' },
        { value: 'Lainnya', label: 'Something else' },
      ],
      message: 'Tell us briefly (optional)',
      messagePlaceholder: 'For example: a distributor with 2 warehouses, orders and stock still tracked in separate Excel files.',
      submit: 'Send my request',
      submitting: 'Sending…',
      note: 'Free consultation, no obligation to continue with a project.',
      privacyNote: 'Your contact details are used to reply to this message.',
      privacyLink: 'Read the privacy policy',
      sentTitle: 'Message sent.',
      sentBody: "Thank you, {name}. We'll be in touch soon.",
      continueWa: 'Or continue on WhatsApp ›',
      errors: {
        check: 'Please check the form.',
        name: 'Please enter your name.',
        contact: 'Please enter a WhatsApp number or email.',
        contactInvalid: 'That WhatsApp number or email does not look right.',
        tooLong: 'Too long.',
        rateLimited: 'Too many submissions from this network. Please contact us on WhatsApp.',
      },
    },
  },

  footer: {
    tagline: 'Custom website, business application, and ERP development in Jakarta.',
    menuTitle: 'Dazytech',
    contactTitle: 'Contact',
    articles: 'Articles (Indonesian)',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    rights: 'All rights reserved.',
  },
};
