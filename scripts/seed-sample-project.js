/**
 * Seed Sample Project: "Lizard Overlords: A Protest"
 * 
 * Creates a demo project with characters, scenes, and a master prompt
 * to showcase the Forge workflow out of the box.
 * 
 * Usage: npm run seed:sample
 * Requires: forge.db to exist (run `npm run dev` once first)
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(process.cwd(), 'forge.db');

const PROJECT_ID = 'lizard-overlords';

const PROJECT = {
  id: PROJECT_ID,
  name: 'Lizard Overlords: A Protest',
  description: 'A postmodern protest poster series. Citizens of a dystopian world rise up against their lizard overlords through bold agitprop art, wheat-paste posters, and underground zines.',
  settings: {
    slug: PROJECT_ID,
    color: '#DC2626',
    status: 'active',
    defaultImageOrientation: 'portrait',
  },
  imagePrompting: {
    masterPrompt: 'postmodern protest poster art bold typography screen-printed texture faded yellowed paper halftone dots hand-drawn elements agitprop energy risograph aesthetic wheat-paste street art underground zine collage mixed media cut-and-paste distressed edges propaganda style subversive political art high contrast limited color palette bold graphic design activist aesthetic DIY punk ethos',
    cameraAngle: 'straight-on confrontational angle poster perspective',
    shotType: 'full frame poster composition',
    lensType: 'flat graphic perspective no depth of field',
    focalLength: 'infinite focus everything sharp',
    lightingStyle: 'flat graphic lighting high contrast',
    lightDirection: 'even front lighting poster style',
    lightQuality: 'hard edges crisp shadows screen print aesthetic',
    shadowStyle: 'bold graphic shadows limited tonal range',
    overallStyle: 'protest poster risograph screen print agitprop',
    aestheticDirection: 'postmodern deconstructed political art',
    mood: 'urgent defiant rebellious dark humor',
    colorPalette: 'limited palette red black cream yellow occasional teal',
    colorTemperature: 'warm yellowed paper with cool accent pops',
    saturation: 'high saturation limited colors screen print style',
    artisticReferences: [
      'Shepard Fairey street art',
      'Russian constructivist propaganda', 
      'Punk zine collage aesthetic',
      'Barbara Kruger bold typography'
    ],
  },
};

const CHARACTERS = [
  {
    id: 'whistleblower',
    name: 'The Whistleblower',
    age: 42,
    gender: 'Non-binary',
    physicalAppearance: 'Gaunt face with sharp cheekbones and deep-set eyes that dart nervously. Thin frame hunched forward as if perpetually looking over their shoulder. Dark circles under eyes from sleepless nights. A small scar across the bridge of their nose.',
    outfits: [
      { name: 'Worn trench coat over a rumpled button-down, cargo pants with bulging pockets full of documents, beat-up leather satchel overflowing with papers' },
      { name: 'Hoodie pulled low over face, dark sunglasses, nondescript gray everything, trying to disappear into a crowd' },
      { name: 'Business casual with a visitor badge still clipped to the lapel from the government building they just fled' },
    ],
    defaultOutfit: 0,
    background: 'Former data analyst for the Reptilian Bureau of Public Affairs. Discovered the truth in the server logs. Now on the run with a flash drive that could change everything.',
    tags: ['protagonist', 'fugitive', 'truth-teller'],
  },
  {
    id: 'street-artist',
    name: 'The Street Artist',
    age: 28,
    gender: 'Female',
    physicalAppearance: 'Athletic build with paint-splattered hands that never fully wash clean. Wild curly hair barely contained under a bandana. Bright determined eyes behind safety goggles pushed up on forehead. Multiple ear piercings. Always has a slight smirk.',
    outfits: [
      { name: 'Paint-splattered overalls over a band t-shirt, bandana mask around neck, utility belt with spray cans and wheat-paste bucket, combat boots' },
      { name: 'All-black stealth outfit for nighttime poster runs, black beanie, gloves, messenger bag full of rolled prints' },
      { name: 'Casual daytime disguise - vintage denim jacket covered in enamel pins, ripped jeans, canvas sneakers' },
    ],
    defaultOutfit: 0,
    background: 'Underground artist whose protest posters have become the visual language of the resistance. Works under the tag "SCALES." Her wheat-paste posters appear overnight on every government building.',
    tags: ['artist', 'resistance', 'propaganda'],
  },
  {
    id: 'conspiracy-theorist',
    name: 'The Conspiracy Theorist',
    age: 55,
    gender: 'Male',
    physicalAppearance: 'Wild unkempt beard with food crumbs. Intense wide eyes that seem to see connections everywhere. Stocky build. Fingers stained with marker ink from connecting dots on his evidence board. Reading glasses perpetually crooked.',
    outfits: [
      { name: 'Tinfoil hat (elaborately constructed), Hawaiian shirt over a "THE TRUTH IS COLD-BLOODED" t-shirt, cargo shorts with every pocket full, sandals with socks' },
      { name: 'Trench coat lined with newspaper clippings, tin foil vest underneath, pockets full of pamphlets' },
      { name: 'Surprisingly normal professor outfit - tweed jacket with elbow patches, khakis - but if you look closely the tie has tiny lizard patterns' },
    ],
    defaultOutfit: 0,
    background: 'Former university professor who was fired for his theories about reptilian infiltration of government. Turns out he was right all along. Runs an underground radio show from his basement. Has a cork board with red string that would make any detective jealous.',
    tags: ['comic-relief', 'prophet', 'broadcaster'],
  },
  {
    id: 'lizard-defector',
    name: 'The Lizard Defector',
    age: 'Unknown (appears 35)',
    gender: 'Male',
    physicalAppearance: 'Unnervingly perfect bone structure that seems almost too symmetrical. Occasionally blinks with a slight delay. Skin has a faint iridescent sheen in certain light. Tall and lean. Moves with an unusual fluidity. Wears colored contacts to hide vertical pupils.',
    outfits: [
      { name: 'Oversized trench coat pulled tight to hide the occasional scale showing at the wrists, wide-brimmed hat casting shadow over face, leather gloves, turtleneck' },
      { name: 'Full human disguise - ill-fitting suburban dad outfit (polo shirt tucked into khakis, white sneakers) trying too hard to blend in' },
      { name: 'Revealed form - partially shed human disguise showing green iridescent scales underneath, torn collar, one human eye and one reptilian' },
    ],
    defaultOutfit: 0,
    background: 'A mid-level bureaucrat in the Lizard Overlord administration who grew a conscience. Defected to the human resistance and now serves as their inside source. Struggles daily with his dual identity. Terrible at human idioms.',
    tags: ['defector', 'insider', 'identity-crisis'],
  },
];

const SCENES = [
  {
    id: 'they-walk-among-us',
    name: 'THEY WALK AMONG US',
    description: 'Classic red and black propaganda poster. Bold blocky text dominates the upper third. Below, a crowd of identical business-suited figures walks through a city street, but their shadows on the ground reveal lizard silhouettes with tails and claws. One figure in the center has turned to look directly at the viewer, one eye human, one eye reptilian with a vertical slit pupil. The overall feel is Soviet constructivist propaganda meets Shepard Fairey.',
    tags: ['propaganda', 'key-visual', 'crowd'],
  },
  {
    id: 'question-the-cold-bloods',
    name: 'QUESTION THE COLD BLOODS',
    description: 'Risograph-printed zine aesthetic with visible registration offset between ink layers. A stylized lizard eye fills the center of the composition, pupil reflecting a government building. Around it, hand-lettered questions in different fonts and sizes: "Why do they keep the thermostat at 95?", "Who approved the cricket cafeteria?", "What happened to the UV light budget?" Torn paper edges, coffee stains, photocopy artifacts. Two-color print: deep teal and warm red on cream stock.',
    tags: ['zine', 'questions', 'paranoia'],
  },
  {
    id: 'scales-of-justice',
    name: 'SCALES OF JUSTICE',
    description: 'A courthouse facade with imposing columns, but the scales of justice statue on top has been revealed as a lizard person, robe partially torn away to show scales underneath. A diverse protest crowd fills the courthouse steps holding hand-painted signs. Screen-printed aesthetic with halftone dots visible in the shadows. The word "JUSTICE" at the top has been crossed out and replaced with hand-scrawled "JUST ICE" (cold-blooded joke). Limited color: red, black, and the yellowed paper showing through.',
    tags: ['courthouse', 'protest', 'justice'],
  },
  {
    id: 'not-my-overlord',
    name: 'NOT MY OVERLORD',
    description: 'A single figure seen from behind, arm raised holding a hand-painted protest sign that reads "NOT MY OVERLORD." They stand in a vast empty plaza facing a massive brutalist government building with a lizard eye logo above the entrance. The sky is overcast and oppressive. The poster is rendered in a woodcut style with bold black lines and a single accent color of protest red. The lone figure against the monolith conveys both defiance and vulnerability.',
    tags: ['protest', 'defiance', 'lone-figure'],
  },
  {
    id: 'shed-your-silence',
    name: 'SHED YOUR SILENCE',
    description: 'Double-meaning visual: a snake skin being shed reveals newspaper headlines underneath, each one an exposé about lizard government corruption. The shed skin forms the silhouette of a megaphone. Bold stencil text "SHED YOUR SILENCE" runs vertically along the left edge. The background is layers of torn protest flyers and wheat-paste residue on a brick wall. Punk collage aesthetic with mixed media textures. Colors: black, white, translucent green for the skin, red for emphasis.',
    tags: ['metaphor', 'media', 'voice'],
  },
  {
    id: 'heat-lamp-district',
    name: 'WELCOME TO THE HEAT LAMP DISTRICT',
    description: 'A satirical tourism poster for the lizard overlord luxury quarter. Art deco style meets propaganda. Gleaming heat lamps line boulevards of a retrofuturistic city. Lizard people in expensive suits lounge on heated marble benches while human workers scurry below in the cold shadows. The tagline reads "Where the elite stay warm." A small resistance sticker in the corner reads "EAT THE COLD-BLOODED." Vintage travel poster palette: warm golds, deep greens, cream.',
    tags: ['satire', 'luxury', 'inequality'],
  },
];

function seed() {
  console.log('🦎 Seeding Lizard Overlords sample project...\n');
  
  let db;
  try {
    db = new Database(dbPath);
  } catch (err) {
    console.error('❌ Oops! Looks like the lizards got to the database first.');
    console.error(`   Could not open forge.db at: ${dbPath}`);
    console.error('   Run "npm run dev" once to initialize the database, then try again.');
    process.exit(1);
  }

  db.pragma('journal_mode = WAL');

  const existingProject = db.prepare('SELECT id FROM projects WHERE id = ?').get(PROJECT_ID);
  if (existingProject) {
    console.log('⚠️  Project "lizard-overlords" already exists. The resistance lives on!');
    console.log('   To re-seed, delete the project first from the app.\n');
    db.close();
    return;
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, description, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const projectSettings = {
    ...PROJECT.settings,
    imagePrompting: PROJECT.imagePrompting,
  };

  insertProject.run(
    PROJECT.id,
    PROJECT.name,
    PROJECT.description,
    JSON.stringify(projectSettings)
  );
  console.log(`✅ Created project: ${PROJECT.name}`);

  const insertCharacter = db.prepare(`
    INSERT INTO characters (id, project_id, name, age, gender, physical_appearance, outfits, default_outfit, background, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const char of CHARACTERS) {
    insertCharacter.run(
      char.id,
      PROJECT_ID,
      char.name,
      String(char.age),
      char.gender,
      char.physicalAppearance,
      JSON.stringify(char.outfits),
      char.defaultOutfit,
      char.background,
      JSON.stringify(char.tags)
    );
    console.log(`  👤 Added character: ${char.name}`);
  }

  const insertScene = db.prepare(`
    INSERT INTO scenes (id, project_id, name, description, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const scene of SCENES) {
    insertScene.run(
      scene.id,
      PROJECT_ID,
      scene.name,
      scene.description,
      JSON.stringify(scene.tags)
    );
    console.log(`  🎬 Added scene: ${scene.name}`);
  }

  db.close();

  console.log('\n🦎 The resistance is seeded. Run "npm run dev" and navigate to the lizard-overlords project.');
  console.log('   Use the Prompt Builder to generate your first protest posters!\n');
  console.log('   Recommended: Nano Banana 2 for images, Veo 3.1 for video.\n');
}

seed();
