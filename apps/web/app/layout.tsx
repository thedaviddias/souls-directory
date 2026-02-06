import { collectionsEnabled } from '@/app/flags'
import { FlagsProvider } from '@/components/flags-provider'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Providers } from '@/components/layout/providers'
import { OrganizationSchema } from '@/components/seo/json-ld'
import { VercelToolbarWrapper } from '@/components/vercel-toolbar'
import { rootMetadata } from '@/lib/seo'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata = rootMetadata

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let collections = false
  try {
    collections = await collectionsEnabled()
  } catch {
    // FLAGS_SECRET missing or flags SDK error; use defaults (collections off)
  }

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <OrganizationSchema />
      </head>
      <body className="font-sans antialiased bg-bg text-text">
        <FlagsProvider collectionsEnabled={collections}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </div>
          </Providers>
          <VercelToolbarWrapper />
        </FlagsProvider>
      </body>
    </html>
  )
}
