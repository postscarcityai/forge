# Forge &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/postscarcityai/forge/blob/main/LICENSE) [![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](https://github.com/postscarcityai/forge) [![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/) [![fal.ai](https://img.shields.io/badge/fal.ai-powered-purple.svg)](https://fal.ai/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/postscarcityai/forge/pulls)

**AI image and video generation platform.** Create visual artifacts with access to all major generation models. Project-centric workflows with characters, scenes, master prompts, and timeline organization.

Part of the [PostScarcity AI](https://github.com/postscarcityai) suite.

---

## What It Does

Forge is a local-first creative platform that turns AI generation into programmable, automated workflows. Define a project with brand colors, characters, scenes, and a master prompt — then generate entire image and video campaigns from a single interface.

- **Multi-model support** — Nano Banana 2, Flux LoRA, Flux Kontext, Ideogram, Veo 3.1, Kling, Sora 2, Luma, Pixverse, Pika, and more
- **Project-centric** — Characters with outfits, scenes with descriptions, master prompts that shape every generation
- **Timeline builder** — Drag and drop images and videos into a timeline, export as a sequence
- **LoRA library** — Ship with public LoRA models ready to use (artistic blur, cinematic surrealism, collage art, halftone, and more)
- **MCP server** — 21 tools for AI assistants to query your project context
- **Local-first** — SQLite database, local file storage, no server costs beyond API credits

### Recommended Models (March 2026)

| Type | Model | Why |
|------|-------|-----|
| **Image** | Nano Banana 2 | Fast, high quality, great with prompts |
| **Video** | Veo 3.1 | Best-in-class image-to-video fidelity |

Forge supports many models via fal.ai. These are the current best-in-class defaults.

---

## Quick Start

```bash
# Clone
git clone https://github.com/postscarcityai/forge.git
cd forge

# Install
npm install

# Add your fal.ai API key
cp docs/config/env-template.txt .env.local
# Edit .env.local and add FAL_KEY=your_key_here

# Start
npm run dev
# Open http://localhost:4900

# (Optional) Seed the sample project
npm run seed:sample
```

### Sample Project: Lizard Overlords

Forge ships with a built-in sample project — a postmodern protest poster series featuring citizens rising up against their lizard overlords. Run `npm run seed:sample` to create it, then open the project to see characters, scenes, and prompts in action.

Characters include The Whistleblower, The Street Artist, The Conspiracy Theorist, and The Lizard Defector. Scenes include "THEY WALK AMONG US," "SCALES OF JUSTICE," and "SHED YOUR SILENCE."

---

## Architecture

```
src/
  app/                    Next.js App Router
    [projectId]/          Project pages (gallery, settings, styles, hidden)
    api/                  API routes for all generation models + database
    about/                About page
  components/
    Gallery/              Main image gallery view
    Timeline/             Timeline builder
    Completed/            Completed projects
    Archived/             Archived projects
    Hidden/               Hidden images
    ui/                   Shared UI (Navbar, Footer, PromptDrawer, ProjectDrawer, etc.)
  contexts/               React contexts (Project, Image, Theme, Layout, DragDrop)
  services/               Database service, audio service
  config/                 Provider configs, aspect ratios
  lib/                    Database, IndexedDB cache, utilities
  mcp/                    Model Context Protocol server (21 tools)
  utils/                  Prompt generation, word budget, metadata, downloads
scripts/
  seed-sample-project.js  Seed the Lizard Overlords demo
  seed-loras.js           Seed the LoRA library
  brand-image-generator.js Generate brand images
docs/
  architecture/           System architecture docs
  features/               Feature specs
  api/                    API documentation
  config/                 Environment template
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| React | 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties |
| Database | SQLite (better-sqlite3) |
| AI | fal.ai (@fal-ai/client) |
| Video | fluent-ffmpeg |
| UI | Framer Motion, @dnd-kit, Lucide React |
| MCP | @modelcontextprotocol/sdk |

---

## Environment Variables

Copy `docs/config/env-template.txt` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `FAL_KEY` | Yes | Your fal.ai API key |
| `NEXT_PUBLIC_BASE_URL` | No | Defaults to `http://localhost:4900` |
| `NEXT_PUBLIC_SITE_URL` | No | Defaults to `http://localhost:4900` |

---

## Scripts

```bash
npm run dev              # Start dev server on port 4900
npm run build            # Production build
npm run seed:sample      # Seed the Lizard Overlords sample project
npm run seed:loras       # Seed the LoRA library
npm run dev:with-mcp     # Dev server + MCP server
npm run mcp:server       # MCP server only
npm run download-images  # Download project images locally
```

---

## License

MIT — see [LICENSE](./LICENSE).

---

*PostScarcity AI. Unlock Abundance.*
