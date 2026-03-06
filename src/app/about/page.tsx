import type { Metadata } from 'next';
import { generatePageMetadata } from '@/utils/metadata';
import Link from 'next/link';

export const metadata: Metadata = generatePageMetadata({
  title: 'About Forge',
  description: 'Forge is a free and open-source AI image and video generation platform by PostScarcity AI.',
  canonical: '/about',
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="space-y-12">
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              PostScarcity AI
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Forge
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AI image and video generation platform. Create visual artifacts with access to all major generation models.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">What it is</h2>
            <p className="text-muted-foreground leading-relaxed">
              Forge is a local-first creative platform that turns AI generation into
              programmable, automated workflows. Define a project with brand colors,
              characters, scenes, and a master prompt — then generate entire image and
              video campaigns from a single interface.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Why it exists</h2>
            <p className="text-muted-foreground leading-relaxed">
              Creative production used to require a team, a budget, and specialized
              tools. Forge gives one person the power to create at the scale of a full
              production studio. It is part of the PostScarcity AI suite — a collection
              of open-source tools designed for the solo operator.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">How it works</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-foreground font-mono text-sm mt-0.5">01</span>
                <span>Create a project with a master prompt that defines your visual language</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-mono text-sm mt-0.5">02</span>
                <span>Add characters with physical descriptions, outfits, and backgrounds</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-mono text-sm mt-0.5">03</span>
                <span>Define scenes that set the stage for each generation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-mono text-sm mt-0.5">04</span>
                <span>Generate images and videos using the Prompt Builder — your master prompt, characters, and scenes combine automatically</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-mono text-sm mt-0.5">05</span>
                <span>Organize into a timeline, export, and ship</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Multi-model image generation',
                'Multi-model video generation',
                'Project-centric workflows',
                'Character & outfit system',
                'Scene library',
                'Master prompt engine',
                'Word budget enforcement',
                'Timeline drag-and-drop',
                'LoRA library (public models)',
                'MCP server (21 tools)',
                'Dark mode',
                'Local-first SQLite',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-foreground flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Open source</h2>
            <p className="text-muted-foreground leading-relaxed">
              Forge is free and open source under the MIT License. The value is not
              in the code — it is in what the code enables.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/postscarcityai/forge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                GitHub
              </a>
              <a
                href="https://github.com/postscarcityai/forge/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                MIT License
              </a>
            </div>
          </section>

          <footer className="pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                PostScarcity AI. Unlock Abundance.
              </p>
              <Link
                href="/"
                className="text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Back to Forge
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
