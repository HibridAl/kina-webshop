import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(seoDefaults.siteUrl),
  title: 'AutoHub - Chinese Car Parts & Accessories',
  description: 'Premium spare parts and accessories for MG, BYD, Omoda, Geely, and Haval vehicles. OEM-quality parts, fast worldwide shipping, competitive prices. Your trusted automotive parts supplier.',
  keywords: 'car parts, automotive, Chinese cars, MG parts, BYD parts, OEM parts, automotive accessories',
  authors: [{ name: 'AutoHub' }],
  creator: 'AutoHub',
  publisher: 'AutoHub',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: seoDefaults.siteUrl,
    siteName: seoDefaults.siteName,
    title: 'AutoHub - Premium Car Parts for Chinese Vehicles',
    description: 'Authentic automotive parts and accessories for MG, BYD, Omoda, Geely, and Haval. Fast shipping worldwide.',
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'AutoHub - Premium Car Parts',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoHub - Premium Car Parts',
    description: 'Quality automotive parts for Chinese vehicles',
    images: [defaultOgImage()],
    creator: '@autohub',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: absoluteUrl('/'),
  },
  icons: {
    icon: '/placeholder.svg',
    apple: '/placeholder.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'OnlineBusiness',
              name: 'AutoHub',
              description: 'Premium spare parts and accessories for Chinese car brands',
              url: 'https://autohub.example.com',
              logo: 'https://autohub.example.com/logo.png',
              sameAs: [
                'https://twitter.com/autohub',
                'https://facebook.com/autohub',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                telephone: '+1-800-AUTO-HUB',
                email: 'support@autohub.com',
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'US',
              },
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
