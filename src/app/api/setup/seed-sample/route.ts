import { NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

const PROJECT_ID = 'lizard-overlords';

export async function POST() {
  try {
    const existingProject = await databaseService.getProject(PROJECT_ID);
    if (existingProject) {
      return NextResponse.json({ 
        success: true, 
        message: 'The resistance was already seeded.' 
      });
    }

    await databaseService.saveProject({
      id: PROJECT_ID,
      name: 'Lizard Overlords: A Protest',
      description: 'A postmodern protest poster series. Citizens rise up against their lizard overlords.',
      settings: {
        slug: PROJECT_ID,
        color: '#DC2626',
        status: 'active',
        defaultImageOrientation: 'portrait',
        imagePrompting: {
          masterPrompt: 'postmodern protest poster art bold typography screen-printed texture faded yellowed paper halftone dots hand-drawn elements agitprop energy risograph aesthetic wheat-paste street art underground zine collage mixed media cut-and-paste distressed edges propaganda style subversive political art high contrast limited color palette bold graphic design activist aesthetic DIY punk ethos',
          overallStyle: 'protest poster risograph screen print agitprop',
          mood: 'urgent defiant rebellious dark humor',
          colorPalette: 'limited palette red black cream yellow occasional teal',
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const characters = [
      {
        id: 'whistleblower', name: 'The Whistleblower', age: '42', gender: 'Non-binary',
        physicalAppearance: 'Gaunt face with sharp cheekbones and deep-set eyes that dart nervously. Thin frame hunched forward. Dark circles under eyes.',
        outfits: [{ name: 'Worn trench coat, rumpled button-down, cargo pants full of documents' }, { name: 'Hoodie pulled low, dark sunglasses, nondescript gray everything' }],
        defaultOutfit: 0, background: 'Former data analyst who discovered the truth in the server logs.', tags: ['protagonist', 'fugitive'],
      },
      {
        id: 'street-artist', name: 'The Street Artist', age: '28', gender: 'Female',
        physicalAppearance: 'Athletic build with paint-splattered hands. Wild curly hair under a bandana. Bright determined eyes.',
        outfits: [{ name: 'Paint-splattered overalls, band t-shirt, spray cans, combat boots' }, { name: 'All-black stealth outfit for nighttime poster runs' }],
        defaultOutfit: 0, background: 'Underground artist whose posters are the visual language of the resistance.', tags: ['artist', 'resistance'],
      },
      {
        id: 'conspiracy-theorist', name: 'The Conspiracy Theorist', age: '55', gender: 'Male',
        physicalAppearance: 'Wild unkempt beard. Intense wide eyes. Fingers stained with marker ink. Reading glasses perpetually crooked.',
        outfits: [{ name: 'Tinfoil hat, Hawaiian shirt, "THE TRUTH IS COLD-BLOODED" tee, cargo shorts' }, { name: 'Trench coat lined with newspaper clippings' }],
        defaultOutfit: 0, background: 'Former professor fired for his theories. Turns out he was right.', tags: ['comic-relief', 'prophet'],
      },
      {
        id: 'lizard-defector', name: 'The Lizard Defector', age: 'Unknown', gender: 'Male',
        physicalAppearance: 'Unnervingly perfect bone structure. Faint iridescent sheen. Tall and lean. Wears colored contacts to hide vertical pupils.',
        outfits: [{ name: 'Oversized trench coat hiding scales, wide-brimmed hat, turtleneck' }, { name: 'Partially shed disguise showing green scales, one human eye and one reptilian' }],
        defaultOutfit: 0, background: 'Mid-level lizard bureaucrat who grew a conscience and defected.', tags: ['defector', 'insider'],
      },
    ];

    for (const char of characters) {
      await databaseService.saveCharacter({
        ...char,
        projectId: PROJECT_ID,
        outfits: JSON.stringify(char.outfits),
        tags: JSON.stringify(char.tags),
      } as any);
    }

    const scenes = [
      { id: 'they-walk-among-us', name: 'THEY WALK AMONG US', description: 'Classic red and black propaganda poster. Crowd of suited figures with lizard shadows.' },
      { id: 'question-the-cold-bloods', name: 'QUESTION THE COLD BLOODS', description: 'Risograph zine. Lizard eye reflects a government building. Hand-lettered questions.' },
      { id: 'scales-of-justice', name: 'SCALES OF JUSTICE', description: 'Courthouse facade. Justice statue revealed as lizard. Protest crowd. JUSTICE crossed out for JUST ICE.' },
      { id: 'not-my-overlord', name: 'NOT MY OVERLORD', description: 'Lone figure with protest sign facing brutalist government building. Woodcut style.' },
      { id: 'shed-your-silence', name: 'SHED YOUR SILENCE', description: 'Snake skin shed reveals newspaper headlines. Skin forms megaphone silhouette. Punk collage.' },
    ];

    for (const scene of scenes) {
      await databaseService.saveScene({
        ...scene,
        projectId: PROJECT_ID,
        tags: '[]',
      } as any);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'The resistance has been seeded. Long live the warm-blooded.' 
    });
  } catch (error) {
    console.error('Seed sample project failed:', error);
    return NextResponse.json(
      { success: false, error: 'The lizards intercepted the operation.' },
      { status: 500 }
    );
  }
}
