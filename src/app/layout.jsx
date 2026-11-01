import { JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { SITE_URL } from '@/lib/site'

import '@/styles/tailwind.css'

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const title = 'Prakhar Baveja - Full Stack Software Engineer'
const description =
  'Here you can find some of my work with the technologies used to create them. Be it a SaaS, RESTful API or an elegant box-shadow, I can help you craft it!'

export const metadata = {
  // Lets every nested page express canonical/OG URLs as plain paths.
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s - Prakhar Baveja',
    default: title,
  },
  description,
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Prakhar Baveja',
    locale: 'en_US',
    url: '/',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex h-full bg-paper dark:bg-ink">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
