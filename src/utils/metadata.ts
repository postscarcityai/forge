import { Metadata } from 'next';

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  noFollow?: boolean;
}

const defaultMetadata = {
  title: "Forge - AI Creative Platform",
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
  referrer: "origin-when-cross-origin" as const,
};

export function generatePageMetadata(pageData: PageMetadata): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';
  const fullTitle = pageData.title === defaultMetadata.title 
    ? pageData.title 
    : `${pageData.title} | ${defaultMetadata.title}`;

  return {
    ...defaultMetadata,
    title: fullTitle,
    description: pageData.description,
    keywords: pageData.keywords || defaultMetadata.keywords,
    
    alternates: pageData.canonical ? {
      canonical: `${siteUrl}${pageData.canonical}`
    } : undefined,
    
    robots: {
      index: !pageData.noIndex,
      follow: !pageData.noFollow,
      googleBot: {
        index: !pageData.noIndex,
        follow: !pageData.noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    openGraph: {
      title: fullTitle,
      description: pageData.description,
      url: pageData.canonical ? `${siteUrl}${pageData.canonical}` : undefined,
      siteName: defaultMetadata.title,
      type: pageData.ogType || 'website',
      locale: 'en_US',
      images: pageData.ogImage ? [
        {
          url: pageData.ogImage.startsWith('http') ? pageData.ogImage : `${siteUrl}${pageData.ogImage}`,
          width: 1200,
          height: 630,
          alt: pageData.title,
        }
      ] : [
        {
          url: `${siteUrl}/images/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: defaultMetadata.title,
        }
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: pageData.description,
      site: '@postscarcityai',
      creator: '@postscarcityai',
      images: pageData.ogImage ? [
        pageData.ogImage.startsWith('http') ? pageData.ogImage : `${siteUrl}${pageData.ogImage}`
      ] : [
        `${siteUrl}/images/og-default.jpg`
      ],
    },
    
    other: {
      'theme-color': '#000000',
    },
  };
}

export const pageMetadata = {
  home: {
    title: "Forge - AI Creative Platform",
    description: "Create stunning AI-generated images and videos with multiple models including Nano Banana 2, Veo 3.1, Flux, and more. Free, open-source framework for creative professionals.",
    canonical: "/",
    keywords: ["ai image generation", "ai video generation", "nano banana", "veo", "flux", "creative ai", "open source"],
  },
  
  gallery: (projectName: string) => ({
    title: `${projectName} Gallery - AI Generated Images`,
    description: `Browse and manage AI-generated images for the ${projectName} project. Organize, timeline, and export your creative content.`,
    canonical: `/${projectName}`,
    keywords: ["ai gallery", "image management", "creative project", projectName.toLowerCase()],
  }),
  
  settings: (projectName: string) => ({
    title: `${projectName} Settings - Project Configuration`,
    description: `Configure project settings, prompts, characters, and scenes for ${projectName}. Manage your AI generation workflow.`,
    canonical: `/${projectName}/settings`,
    keywords: ["project settings", "ai configuration", "prompt management", projectName.toLowerCase()],
    noIndex: true,
  }),
  
  archived: {
    title: "Archived Projects - Forge",
    description: "Browse archived AI image generation projects. Access completed work and previous creative explorations.",
    canonical: "/archived",
    keywords: ["archived projects", "completed work", "project history"],
  },
  
  completed: {
    title: "Completed Projects - Forge", 
    description: "View completed AI image generation projects. Showcase of finished creative work and successful campaigns.",
    canonical: "/completed",
    keywords: ["completed projects", "finished work", "creative showcase"],
  },
  
  hidden: (projectName?: string) => ({
    title: projectName ? `Hidden Images - ${projectName}` : "Hidden Images - Forge",
    description: projectName 
      ? `Manage hidden and unused images for the ${projectName} project.`
      : "Browse hidden and unused AI-generated images across all projects.",
    canonical: projectName ? `/${projectName}/hidden` : "/hidden",
    keywords: ["hidden images", "unused content", "image management"],
    noIndex: true,
  }),
  
  styles: (projectName: string) => ({
    title: `${projectName} Styles - Visual Identity`,
    description: `Define and manage visual styles, brand guidelines, and aesthetic preferences for the ${projectName} project.`,
    canonical: `/${projectName}/styles`,
    keywords: ["visual styles", "brand identity", "design guidelines", projectName.toLowerCase()],
  }),
};

export function generateOrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PostScarcity AI',
    description: 'AI-powered creative tools and platforms for modern professionals',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    sameAs: [
      'https://github.com/postscarcityai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@postscarcity.ai',
      contactType: 'Customer Service',
    },
  };
}

export function generateSoftwareApplicationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Forge - AI Creative Platform',
    description: 'A free and open-source AI image and video generation platform by PostScarcity AI.',
    url: siteUrl,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free and open-source',
    },
    creator: {
      '@type': 'Organization',
      name: 'PostScarcity AI',
    },
    features: [
      'AI Image Generation',
      'AI Video Generation',
      'Multi-Model Support',
      'Project Management', 
      'Timeline Organization',
      'Character Database',
      'Scene Library',
    ],
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}
