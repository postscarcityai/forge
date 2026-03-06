// Script to create characters and scenes from the AMC personas
const personas = [
  {
    id: "david_rosen",
    name: "David Rosen",
    age: 52,
    gender: "Male",
    race: "White (Jewish)",
    height: "5'11\"",
    hairColor: "Salt-and-pepper",
    eyeColor: "Brown",
    physicalAppearance: "Distinguished bearing with a slight paunch from years of executive lunches. Piercing brown eyes behind wire-rimmed glasses. Well-groomed salt-and-pepper beard. Shows stress lines around the eyes and mouth from recent legal troubles.",
    outfits: [
      { name: "Expensive Italian navy suit with subtle pinstripes, Swiss luxury watch, Italian leather shoes" },
      { name: "Charcoal Brioni suit with loosened tie and rolled sleeves" },
      { name: "Casual weekend wear - khakis and polo shirt" },
      { name: "Orange prison jumpsuit" },
      { name: "Court appearance - conservative dark suit" }
    ],
    defaultOutfit: 0,
    background: "Miami-based healthcare executive indicted for Medicare fraud",
    profession: "Healthcare Executive",
    caseDetails: "Medicare Fraud Kingpin – Orchestrated a $48M billing scheme involving fake durable medical equipment claims across South Florida",
    sceneOfCrime: "Security footage from his corner office shows David at 11:47 PM, tie loosened, sleeves rolled up, frantically shredding documents while simultaneously deleting files from his computer. Empty scotch glass sits beside stacks of falsified Medicare billing records. His normally perfect hair is disheveled, sweat visible on his forehead as he glances nervously at the door. The timestamp shows this was the night before the FBI raid.",
    notes: "High-profile case with significant media attention",
    tags: ["Federal", "Healthcare Fraud", "Executive", "Miami"]
  },
  {
    id: "maria_alvarez",
    name: "Maria Alvarez",
    age: 38,
    gender: "Female",
    race: "Hispanic",
    height: "5'5\"",
    hairColor: "Black",
    eyeColor: "Hazel",
    physicalAppearance: "Petite but commanding presence. Sleek black hair usually in a low chignon. Hazel eyes that seem to calculate every angle. Manicured nails, subtle but expensive jewelry. Carries herself with confidence despite legal pressure.",
    outfits: [
      { name: "Sharp tailored Diane von Furstenberg dress in jewel tones with Hermès handbag" },
      { name: "Theory business suit with stiletto heels and designer accessories" },
      { name: "Operational mode - minimal makeup, dark pantsuit, practical shoes" },
      { name: "Court appearance - conservative navy suit with modest jewelry" },
      { name: "Casual weekend - designer jeans and cashmere sweater" }
    ],
    defaultOutfit: 0,
    background: "New York accountant accused of wire fraud and money laundering",
    profession: "Accountant",
    caseDetails: "Luxury Lifestyle Laundress – Laundered $7.5M through shell LLCs linked to bogus PPP loans and offshore crypto wallets",
    sceneOfCrime: "Bank surveillance captures Maria in a private meeting room at 6:15 AM, before normal business hours. She's hunched over a laptop, wire-transferring funds through multiple shell company accounts displayed on three different screens. Stacks of fake PPP loan applications spread across the mahogany table. A burner phone buzzes constantly beside her coffee cup. Her usually perfect makeup is minimal – this is Maria in pure operational mode.",
    notes: "Sophisticated financial crimes with international connections",
    tags: ["Federal", "Wire Fraud", "Money Laundering", "New York"]
  },
  {
    id: "tommy_brennan",
    name: "Tommy Brennan",
    age: 45,
    gender: "Male",
    race: "White (Irish)",
    height: "6'2\"",
    hairColor: "Reddish-brown",
    eyeColor: "Blue",
    physicalAppearance: "Tall and broad-shouldered with calloused hands from construction work. Reddish-brown hair with gray at the temples. Piercing blue eyes. Strong jaw with a day's stubble. Weathered face from years of outdoor work. Slight limp from old injury.",
    outfits: [
      { name: "Hard hat, high-vis vest, work boots, and dirty jeans" },
      { name: "Clean button-down shirt and khakis for meeting with feds" },
      { name: "Sunday best - navy suit that doesn't quite fit right" },
      { name: "Undercover wire - regular clothes with hidden recording device" },
      { name: "Casual bar clothes - flannel shirt and beer-stained jeans" }
    ],
    defaultOutfit: 0,
    background: "Boston construction foreman turned federal informant",
    profession: "Construction Foreman",
    caseDetails: "Kickback King – Accepted $2.3M in bribes for city contracts, now cooperating against city officials and union bosses",
    sceneOfCrime: "Security camera shows Tommy in a dimly lit parking garage at 9:30 PM, nervously checking his watch while clutching a manila envelope thick with cash. A black sedan approaches with its headlights off. The driver keeps the engine running as Tommy approaches the passenger window, hands over the envelope, and receives a rolled set of blueprints marked 'CONFIDENTIAL - CITY PLANNING DEPT.'",
    notes: "Key witness in corruption investigation",
    tags: ["Local", "Bribery", "Construction", "Boston", "Informant"]
  },
  {
    id: "detective_sarah_chen",
    name: "Detective Sarah Chen",
    age: 34,
    gender: "Female",
    race: "Asian (Chinese-American)",
    height: "5'7\"",
    hairColor: "Black",
    eyeColor: "Dark brown",
    physicalAppearance: "Athletic build from regular training. Sharp, intelligent dark brown eyes that miss nothing. Black hair pulled back in a practical ponytail during work. Small scar above left eyebrow from academy training. Confident posture that commands respect.",
    outfits: [
      { name: "Detective shield on belt, dark blazer, comfortable slacks, low heels" },
      { name: "SWAT gear - tactical vest, utility belt, combat boots" },
      { name: "Undercover casual - jeans, t-shirt, sneakers, concealed holster" },
      { name: "Court testimony - professional navy suit with minimal jewelry" },
      { name: "Off-duty weekend - athletic wear and running shoes" }
    ],
    defaultOutfit: 0,
    background: "LAPD detective specializing in white-collar crime investigations",
    profession: "Police Detective",
    caseDetails: "Lead investigator on the Medicare fraud case targeting David Rosen and his network of co-conspirators",
    sceneOfCrime: "Body camera footage shows Detective Chen at 6:45 AM, leading a team of federal agents through the marble lobby of a downtown high-rise. She's checking her weapon while coordinating with FBI agents via earpiece, reviewing warrant details on her tablet one final time before the elevator doors open on the executive floor. Her expression is focused and determined as she prepares to execute the arrest warrant.",
    notes: "Decorated officer with excellent case closure rate",
    tags: ["Law Enforcement", "Detective", "LAPD", "Investigation"]
  },
  {
    id: "judge_patricia_williams",
    name: "Judge Patricia Williams",
    age: 58,
    gender: "Female",
    race: "Black",
    height: "5'6\"",
    hairColor: "Gray",
    eyeColor: "Brown",
    physicalAppearance: "Dignified presence with silver-gray hair styled in a professional bob. Warm brown eyes that can turn stern when needed. Reading glasses perched on nose. Carries herself with the authority of decades on the bench. Slight smile lines suggest fairness tempered with wisdom.",
    outfits: [
      { name: "Black judicial robes with white collar, reading glasses" },
      { name: "Conservative business suit for public appearances" },
      { name: "Casual chambers attire - cardigan and slacks" },
      { name: "Formal evening wear for judicial functions" },
      { name: "Weekend casual - comfortable dress and flats" }
    ],
    defaultOutfit: 0,
    background: "Federal district judge with 20 years experience in white-collar criminal cases",
    profession: "Federal Judge",
    caseDetails: "Presiding judge in high-profile Medicare fraud case, known for tough but fair sentencing",
    sceneOfCrime: "Courtroom security camera captures Judge Williams at 2:15 PM, reviewing sentencing guidelines with her law clerk while stacks of evidence binders tower on her desk. She's making careful notes in the margins of legal documents, occasionally removing her reading glasses to rub her temples. The weight of the decision ahead is visible in her thoughtful expression as she prepares for a sentencing that could send executives to prison for decades.",
    notes: "Respected jurist known for thorough case preparation",
    tags: ["Federal", "Judge", "Judiciary", "Sentencing"]
  }
];

// Expanded scene data
const scenes = [
  {
    id: "david_rosen_office_scene",
    name: "David's Office Document Destruction",
    setting: "Executive corner office, high-rise building, Miami",
    timeOfDay: "Night",
    lighting: "Fluorescent office lighting, desk lamp",
    mood: "Desperate, frantic, paranoid",
    cameraAngle: "Security camera perspective from ceiling corner",
    description: "Security footage from corner office shows executive frantically shredding documents while simultaneously deleting computer files. Empty scotch glass beside stacks of falsified Medicare billing records. Hair disheveled, sweat visible, glancing nervously at door. Night before FBI raid.",
    atmosphere: "Tense, fluorescent lighting creating harsh shadows",
    characterIds: ["david_rosen"],
    props: [
      "Industrial paper shredder",
      "Desktop computer with multiple monitors", 
      "Stacks of Medicare billing records",
      "Empty scotch glass",
      "Filing cabinets"
    ],
    notes: "Key evidence of obstruction of justice",
    tags: ["Crime Scene", "Office", "Document Destruction", "Fraud"]
  },
  {
    id: "maria_alvarez_bank_scene",
    name: "Maria's Early Morning Money Transfer",
    setting: "Private bank meeting room, downtown financial district",
    timeOfDay: "Early Morning",
    lighting: "Soft morning light through windows, laptop screen glow",
    mood: "Cold, calculating, operational",
    cameraAngle: "Bank surveillance camera mounted high on wall",
    description: "Bank surveillance captures accountant in private meeting room at 6:15 AM, before normal business hours. Hunched over laptop, wire-transferring funds through multiple shell company accounts displayed on three screens. Stacks of fake PPP loan applications spread across mahogany table. Burner phone buzzing constantly.",
    atmosphere: "Pre-dawn quiet, sterile bank environment",
    characterIds: ["maria_alvarez"],
    props: [
      "High-end laptop",
      "Multiple large monitors",
      "Fake PPP loan applications", 
      "Burner phone",
      "Coffee cup"
    ],
    notes: "Evidence of money laundering operation",
    tags: ["Crime Scene", "Bank", "Money Laundering", "Wire Transfer"]
  },
  {
    id: "tommy_parking_garage_scene",
    name: "Tommy's Parking Garage Bribe Exchange",
    setting: "Dimly lit underground parking garage, downtown Boston",
    timeOfDay: "Night",
    lighting: "Sparse overhead fluorescents, car headlights off",
    mood: "Nervous, secretive, criminal",
    cameraAngle: "High-angle security camera with partial obstruction",
    description: "Security camera shows construction foreman nervously checking his watch while clutching manila envelope thick with cash. Black sedan approaches with headlights off. Driver keeps engine running as foreman approaches passenger window, hands over envelope, receives rolled blueprints marked 'CONFIDENTIAL - CITY PLANNING DEPT.'",
    atmosphere: "Cold concrete, shadows, echo of footsteps",
    characterIds: ["tommy_brennan"],
    props: [
      "Manila envelope thick with cash",
      "Black sedan with tinted windows",
      "Rolled blueprints marked confidential",
      "City planning department documents", 
      "Concrete pillars casting shadows"
    ],
    notes: "Evidence of systematic bribery scheme",
    tags: ["Crime Scene", "Bribery", "Parking Garage", "Corruption"]
  },
  {
    id: "fbi_raid_scene",
    name: "FBI Raid on Healthcare Executive",
    setting: "Marble lobby and executive floor of downtown high-rise",
    timeOfDay: "Early Morning",
    lighting: "Bright lobby lighting, fluorescent office lights",
    mood: "Tense, official, overwhelming force",
    cameraAngle: "Multiple body cameras and security cameras",
    description: "Body camera footage shows detective leading team of federal agents through marble lobby at 6:45 AM. Detective checking weapon while coordinating with FBI via earpiece, reviewing warrant details on tablet before elevator opens on executive floor. Focused and determined expression preparing for arrest.",
    atmosphere: "Professional law enforcement operation, controlled chaos",
    characterIds: ["detective_sarah_chen"],
    props: [
      "Federal arrest warrant",
      "Body cameras and recording equipment",
      "Service weapons and tactical gear",
      "Tablets with case files",
      "FBI raid jackets and badges"
    ],
    notes: "Coordinated federal law enforcement operation",
    tags: ["Law Enforcement", "FBI Raid", "Arrest", "Investigation"]
  },
  {
    id: "courtroom_sentencing_scene",
    name: "Federal Courtroom Sentencing Preparation",
    setting: "Federal courthouse chambers and courtroom",
    timeOfDay: "Afternoon",
    lighting: "Natural light from tall windows, warm lamp lighting",
    mood: "Solemn, weighty, judicial",
    cameraAngle: "Courtroom security camera from gallery perspective",
    description: "Courtroom security camera captures judge at 2:15 PM, reviewing sentencing guidelines with law clerk while stacks of evidence binders tower on desk. Making careful notes in margins of legal documents, occasionally removing reading glasses to rub temples. Weight of decision visible in thoughtful expression preparing for sentencing.",
    atmosphere: "Quiet dignity of federal courthouse, weight of justice",
    characterIds: ["judge_patricia_williams"],
    props: [
      "Federal sentencing guidelines",
      "Stacks of evidence binders", 
      "Legal documents with handwritten notes",
      "Reading glasses"
    ],
    notes: "Preparation for high-profile sentencing hearing",
    tags: ["Courtroom", "Federal", "Sentencing", "Justice"]
  }
];

const projectId = "amc";

// Test function to check database schema
async function testDatabase() {
  try {
    console.log('🔍 Testing database schema...');
    
    // Try to get existing characters to test the connection
    const response = await fetch('http://localhost:3000/api/database/characters?projectId=amc');
    const result = await response.json();
    console.log('Database connection test:', result);
    
    // Try to create a simple test character
    const testCharacter = {
      id: "test_character",
      name: "Test Character",
      age: 30,
      gender: "Male",
      race: "Test",
      height: "6'0\"",
      hairColor: "Brown",
      eyeColor: "Blue",
      physicalAppearance: "Test description",
      outfits: [{ name: "Test outfit" }],
      defaultOutfit: 0,
      background: "Test background",
      profession: "Test profession",
      caseDetails: "Test case",
      sceneOfCrime: "Test scene",
      notes: "Test notes",
      tags: ["Test"],
      projectId: "amc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createResponse = await fetch('http://localhost:3000/api/database/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCharacter)
    });

    const createResult = await createResponse.json();
    console.log('Test character creation:', createResult);

  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Function to create characters
async function createCharacters() {
  console.log('🎭 Creating characters...');
  
  for (const persona of personas) {
    try {
      const character = {
          ...persona,
          projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:3000/api/database/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
    });

    const result = await response.json();
      console.log(`✅ Created character: ${persona.name}`, result.success ? '✓' : '✗');
  } catch (error) {
      console.error(`❌ Failed to create character ${persona.name}:`, error);
    }
  }
}

// Function to create scenes
async function createScenes() {
  console.log('🎬 Creating scenes...');
  
    for (const scene of scenes) {
    try {
      const sceneData = {
        ...scene,
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:3000/api/database/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sceneData)
      });

      const result = await response.json();
      console.log(`✅ Created scene: ${scene.name}`, result.success ? '✓' : '✗');
    } catch (error) {
      console.error(`❌ Failed to create scene ${scene.name}:`, error);
    }
  }
}

// Function to create project
async function createProject() {
  console.log('📁 Creating AMC project...');
  
  try {
    const projectData = {
      id: projectId,
      name: "AMC Crime Drama Production",
      description: "Crime procedural characters and scenes for AMC network production",
      color: "#e74c3c",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessOverview: {
        companyDescription: "Premium cable network specializing in dramatic television series",
        missionStatement: "Deliver compelling, character-driven narratives that engage and entertain audiences",
        visionStatement: "To be the leading destination for premium dramatic television content",
        coreValues: ["Authentic Storytelling", "Character Development", "Production Excellence"],
        targetAudience: "Adults 25-54 seeking quality dramatic content",
        offerings: ["Original Drama Series", "Crime Procedurals", "Character Studies"],
        keyDifferentiators: ["High Production Values", "Complex Characters", "Realistic Storylines"],
        industryContext: "Premium cable television production",
        geographicScope: "United States cable television market"
      },
      brandStory: {
        brandNarrative: "AMC creates television that matters - stories that resonate with real human experiences",
        brandPersonality: "Sophisticated, Gritty, Authentic, Compelling",
        voiceAndTone: "Serious but accessible, dramatic without being melodramatic",
        messagingPillars: ["Character-Driven Stories", "Production Quality", "Authentic Drama"],
        visualIdentity: {
          primaryColors: ["#1a1a1a", "#c41e3a", "#ffffff"],
          secondaryColors: ["#2c2c2c", "#8b0000", "#f5f5f5"],
          typography: ["Helvetica Neue", "Arial", "Trade Gothic"],
          imageryStyle: "Cinematic, realistic, high-contrast lighting with dramatic shadows",
          logoGuidelines: "Clean, bold typography with red accent for drama genre"
        },
        contentThemes: ["Justice", "Moral Complexity", "Human Nature", "Crime and Consequences"],
        storytellingApproach: "Character-first narratives with authentic dialogue and realistic scenarios",
        audienceConnection: "Stories that reflect real-world issues and human struggles"
      },
      imagePrompting: {
        masterPrompt: "Professional crime drama television production, cinematic realism, dramatic lighting",
        overallStyle: "Cinematic television drama realism",
        aestheticDirection: "High-end cable television production values",
        mood: "Serious, dramatic, authentic crime procedural atmosphere",
        cameraAngle: "Television cinematography perspective",
        shotType: "Professional television medium shots and close-ups",
        lensType: "Cinema-quality lenses with professional depth of field",
        lightingStyle: "Dramatic television lighting with controlled shadows",
        lightDirection: "Professional three-point lighting setup",
        lightQuality: "High-end television production lighting",
        shadowStyle: "Strategic dramatic shadows for television",
        timeOfDay: "Variable based on scene requirements",
        colorPalette: "Desaturated earth tones with dramatic color grading",
        colorTemperature: "Cool professional television color balance",
        saturation: "Controlled saturation levels for television broadcast"
      },
      loras: {
        lora1: {
          id: "dramatic_lighting",
          name: "Dramatic Lighting LoRA",
          path: "/models/loras/dramatic_lighting_v1.safetensors",
          scale: 0.8,
          enabled: true,
          triggerWords: ["dramatic lighting", "television cinematography", "crime drama"]
        },
        lora2: {
          id: "professional_portrait",
          name: "Professional Portrait LoRA", 
          path: "/models/loras/professional_portrait_v2.safetensors",
          scale: 0.6,
          enabled: true,
          triggerWords: ["professional portrait", "character study", "television actor"]
        }
      }
    };

    const response = await fetch('http://localhost:3000/api/database/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    const result = await response.json();
    console.log('✅ Created AMC project:', result.success ? '✓' : '✗');
    return result;
  } catch (error) {
    console.error('❌ Failed to create AMC project:', error);
    return null;
  }
}

// Main execution function
async function main() {
  console.log('🚀 Setting up AMC Crime Drama Database...\n');
  
  // Test database connection first
  await testDatabase();
  
  // Create project first
  await createProject();
  
  // Create all characters
  await createCharacters();
  
  // Create all scenes
  await createScenes();
  
  console.log('\n✅ AMC Crime Drama database setup complete!');
  console.log('📊 Created:');
  console.log(`   • 1 Project (${projectId})`);
  console.log(`   • ${personas.length} Characters`);
  console.log(`   • ${scenes.length} Scenes`);
  console.log('\nReady for crime drama production! 🎬');
}

// Run the script
main().catch(console.error); 