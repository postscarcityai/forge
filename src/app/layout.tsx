import type { Metadata, Viewport } from "next";
import "./globals.css";
import { montserrat, geist } from "./fonts";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ImageProvider } from "@/contexts/ImageContext";
import { DragDropProvider } from "@/contexts/DragDropContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LayoutContainer } from "@/components/ui/LayoutContainer";
import { ConditionalNavbar } from "@/components/ui/ConditionalNavbar";
import { TimelineDrawer } from "@/components/ui/TimelineDrawer";
import { Footer } from "@/components/ui/Footer";
import { generateOrganizationSchema, generateSoftwareApplicationSchema } from "@/utils/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';

export const metadata: Metadata = {
  title: {
    default: "Forge - AI Creative Platform",
    template: "%s | Forge",
  },
  description: "A free and open-source AI image and video generation platform. Create visual artifacts with access to all major generation models.",
  keywords: [
    "ai",
    "image-generation",
    "video-generation",
    "creative-tools",
    "forge",
    "open-source",
    "nextjs",
    "postscarcity-ai"
  ],
  authors: [{ name: "PostScarcity AI", url: "https://postscarcity.ai" }],
  creator: "PostScarcity AI",
  publisher: "PostScarcity AI",
  applicationName: "forge",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Forge',
    title: 'Forge - AI Creative Platform',
    description: 'A free and open-source AI image and video generation platform. Create visual artifacts with access to all major generation models.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Forge - AI Creative Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@postscarcityai',
    creator: '@postscarcityai',
    title: 'Forge - AI Creative Platform',
    description: 'A free and open-source AI image and video generation platform. Create visual artifacts with access to all major generation models.',
    images: ['/images/og-default.jpg'],
  },
  other: {
    'theme-color': '#000000',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const softwareSchema = generateSoftwareApplicationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('forge-theme') || 'system';
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolvedTheme = theme === 'system' ? systemTheme : theme;
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${geist.variable} antialiased min-h-screen overflow-x-hidden`}>
        <ThemeProvider>
        <ProjectProvider>
          <ImageProvider>
            <DragDropProvider>
              <LayoutProvider>
                <LayoutContainer>
                  <ConditionalNavbar />
                  <TimelineDrawer />
                  <main className="flex-1 overflow-x-hidden">
                    {children}
                  </main>
                  <Footer />
                </LayoutContainer>
              </LayoutProvider>
            </DragDropProvider>
          </ImageProvider>
        </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
