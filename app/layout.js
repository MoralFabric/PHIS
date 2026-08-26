import './globals.css'

// Absolute base for og:image and canonical URLs. Vercel injects
// VERCEL_PROJECT_PRODUCTION_URL automatically (custom domain if one is attached);
// set NEXT_PUBLIC_SITE_URL to override.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

const CARD_TITLE = 'Adam Waldman, CFA | Builds the systems that turn information into decisions.'
const CARD_DESC =
  'Twenty years of finance, data and insight leadership across global wealth, asset management and pensions. Explore the work, see how it fits a role you are hiring for, or interview me directly.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Adam Waldman, CFA',
  description: CARD_DESC,
  applicationName: 'phis',
  authors: [{ name: 'Adam Waldman' }],
  keywords: [
    'Adam Waldman',
    'data and analytics leader',
    'insight strategy',
    'enterprise planning',
    'FP&A',
    'CFA',
    'Toronto',
  ],
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'phis',
    title: CARD_TITLE,
    description: CARD_DESC,
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: CARD_TITLE,
    description: CARD_DESC,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
