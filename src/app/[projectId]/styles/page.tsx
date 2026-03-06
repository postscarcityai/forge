import { 
  Display, 
  Heading, 
  Subheading, 
  Title, 
  Label, 
  Caption, 
  Body, 
  Small, 
  Muted, 
  Overline,
  GeistTitle 
} from '@/components/ui/Typography';
import { Icon, Star, Heart, Settings, User } from '@/components/ui/Icon';
import { generatePageMetadata, pageMetadata } from '@/utils/metadata';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  
  // Map known project IDs to readable names
  const projectNames: Record<string, string> = {
    'default': 'Default Project',
  };
  
  const projectName = projectNames[projectId] || projectId.toUpperCase();
  const metaData = pageMetadata.styles(projectName);
  
  return generatePageMetadata(metaData);
}

export default function ProjectStylesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Overline>Design System Showcase</Overline>
          <GeistTitle>
            Sophisticated Typography
          </GeistTitle>
          <Body className="max-w-2xl mx-auto text-muted-foreground">
            A meticulously crafted design system built with Montserrat typography, 
            Lucide icons, and a carefully curated monochromatic palette featuring 
            black, white, and tastefully desaturated grays.
          </Body>
        </div>
      </section>

      {/* Typography Demonstration */}
      <section className="container mx-auto px-6 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Overline>Typography Scale</Overline>
            <Heading>Fiercely Designed Text Hierarchy</Heading>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Typography Examples */}
            <div className="space-y-6">
              <div>
                <Small className="mb-2">Geist Title - Large & Thin</Small>
                <GeistTitle>Refined Elegance</GeistTitle>
              </div>
              
              <div>
                <Small className="mb-2">Display (H1)</Small>
                <Display>Design Excellence</Display>
              </div>
              
              <div>
                <Small className="mb-2">Heading (H2)</Small>
                <Heading>Primary Headlines</Heading>
              </div>
              
              <div>
                <Small className="mb-2">Subheading (H3)</Small>
                <Subheading>Secondary Titles</Subheading>
              </div>
              
              <div>
                <Small className="mb-2">Title (H4)</Small>
                <Title>Section Titles</Title>
              </div>
              
              <div>
                <Small className="mb-2">Label (H5)</Small>
                <Label>Component Labels</Label>
              </div>
              
              <div>
                <Small className="mb-2">Caption (H6)</Small>
                <Caption>Detailed Captions</Caption>
              </div>
            </div>

            {/* Text Styles */}
            <div className="space-y-6">
              <div>
                <Small className="mb-2">Body Text</Small>
                <Body>This is the primary body text style used throughout the application. It maintains excellent readability while providing a sophisticated aesthetic.</Body>
              </div>
              
              <div>
                <Small className="mb-2">Small Text</Small>
                <Small>Smaller supplementary text for secondary information, metadata, and subtle details.</Small>
              </div>
              
              <div>
                <Small className="mb-2">Muted Text</Small>
                <Muted>Muted text style for de-emphasized content that should remain readable but not compete with primary content.</Muted>
              </div>
              
              <div>
                <Small className="mb-2">Overline Style</Small>
                <Overline>Section Categories • Navigation • Labels</Overline>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color System */}
      <section className="container mx-auto px-6 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Overline>Color System</Overline>
            <Heading>Monochromatic Excellence</Heading>
            <Body className="text-muted-foreground">
              A sophisticated palette of blacks, whites, and carefully selected grays 
              with subtle cool undertones for visual depth.
            </Body>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { name: 'Black', class: 'bg-black', text: 'text-white' },
              { name: 'Gray 950', class: 'bg-gray-950', text: 'text-white dark:text-black' },
              { name: 'Gray 800', class: 'bg-gray-800', text: 'text-white dark:text-black' },
              { name: 'Gray 600', class: 'bg-gray-600', text: 'text-white dark:text-black' },
              { name: 'Gray 400', class: 'bg-gray-400', text: 'text-black dark:text-white' },
              { name: 'Gray 200', class: 'bg-gray-200', text: 'text-black dark:text-white' },
              { name: 'Gray 100', class: 'bg-gray-100', text: 'text-black dark:text-white' },
              { name: 'Gray 50', class: 'bg-gray-50', text: 'text-black dark:text-white' },
              { name: 'White', class: 'bg-white border border-border', text: 'text-black dark:text-white' },
            ].map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`${color.class} h-16 rounded-md flex items-center justify-center`}>
                  <Small className={color.text}>{color.name}</Small>
                </div>
              </div>
            ))}
          </div>

          {/* Semantic Colors Demo */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Background', class: 'bg-background border border-border', text: 'text-foreground' },
              { name: 'Foreground', class: 'bg-foreground', text: 'text-background' },
              { name: 'Muted', class: 'bg-muted', text: 'text-background' },
              { name: 'Accent', class: 'bg-accent border border-border', text: 'text-accent-foreground' },
            ].map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`${color.class} h-16 rounded-md flex items-center justify-center`}>
                  <Small className={color.text}>{color.name}</Small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Icons Demonstration */}
      <section className="container mx-auto px-6 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Overline>Icon System</Overline>
            <Heading>Lucide React Icons</Heading>
            <Body className="text-muted-foreground">
              Consistent, scalable icons with multiple size variants and perfect 
              integration with our typography system.
            </Body>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Star, label: 'Star', size: 'lg' as const },
              { icon: Heart, label: 'Heart', size: 'lg' as const },
              { icon: Settings, label: 'Settings', size: 'lg' as const },
              { icon: User, label: 'User', size: 'lg' as const },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-3">
                <div className="flex justify-center">
                  <Icon icon={item.icon} size={item.size} className="text-muted-foreground" />
                </div>
                <Caption>{item.label}</Caption>
              </div>
            ))}
          </div>

          <div className="text-center space-y-4">
            <Small>Available sizes: xs, sm, md, lg, xl</Small>
            <div className="flex justify-center items-center space-x-4">
              <Icon icon={Star} size="xs" className="text-muted-foreground" />
              <Icon icon={Star} size="sm" className="text-muted-foreground" />
              <Icon icon={Star} size="md" className="text-muted-foreground" />
              <Icon icon={Star} size="lg" className="text-muted-foreground" />
              <Icon icon={Star} size="xl" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4">
            <Overline>Forge Design System</Overline>
            <Muted>
              Built with Next.js, TypeScript, Tailwind CSS, and meticulous attention to detail.
            </Muted>
          </div>
        </div>
      </footer>
    </main>
  );
}

export async function generateStaticParams() {
  return [
    { projectId: 'default' },
  ];
} 