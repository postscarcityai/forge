import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4900';
  
  const projects = ['default'];
  
  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/archived`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/completed`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Add project-specific routes
  projects.forEach((projectId) => {
    routes.push(
      // Project gallery
      {
        url: `${siteUrl}/${projectId}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      // Project styles
      {
        url: `${siteUrl}/${projectId}/styles`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }
      // Note: Settings and hidden pages are excluded as they're private
    );
  });

  return routes;
}



