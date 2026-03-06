import { buildStructuredPrompt } from './characterPromptGeneration';
import { logWordBudgetAnalysis } from './wordBudgetEnforcer';

/**
 * Test the 9-component word budget system and display detailed breakdown
 */
export async function testWordBudgetSystem(params: {
  userPrompt: string;
  characterName?: string;
  characterOutfit?: string | number;
  sceneName?: string;
  projectId: string;
}): Promise<void> {
  console.log('🧪 Testing 9-Component Word Budget System');
  console.log('═'.repeat(50));
  console.log(`📝 User Prompt: "${params.userPrompt}"`);
  console.log(`👤 Character: ${params.characterName || 'None'}`);
  console.log(`👕 Outfit: ${params.characterOutfit || 'Default'}`);
  console.log(`🎬 Scene: ${params.sceneName || 'None'}`);
  console.log(`📁 Project: ${params.projectId}`);
  console.log('═'.repeat(50));

  try {
    const result = await buildStructuredPrompt(params);
    
    console.log('\n📊 WORD BUDGET ANALYSIS:');
    logWordBudgetAnalysis(result.budgetReport);
    
    console.log('\n📝 FINAL PROMPT PREVIEW:');
    console.log('─'.repeat(50));
    console.log(result.prompt);
    console.log('─'.repeat(50));
    
    console.log('\n✅ TEST SUMMARY:');
    console.log(`📈 Total Words: ${result.wordCount}/384`);
    console.log(`🎯 Compliance: ${result.budgetReport.compliance ? '✅ PASS' : '❌ FAIL'}`);
    if (result.budgetReport.overageWords > 0) {
      console.log(`⚠️ Overage: ${result.budgetReport.overageWords} words`);
    }
    
    console.log('\n🔧 COMPONENT DETAILS:');
    Object.entries(result.components).forEach(([name, content]) => {
      const componentReport = result.budgetReport.components[name as keyof typeof result.budgetReport.components];
      const status = componentReport.compliance ? '✅' : '❌';
      console.log(`${status} ${name}: ${componentReport.actualWords}/${componentReport.budgetWords} words (${componentReport.utilizationPercentage}%)`);
      if (content.trim()) {
        console.log(`   "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Run multiple test scenarios
 */
export async function runWordBudgetTestSuite(): Promise<void> {
  console.log('\n🚀 RUNNING WORD BUDGET TEST SUITE');
  console.log('═'.repeat(60));
  
  const testCases = [
    {
      name: 'Portrait Test',
      params: {
        userPrompt: 'a person standing in dramatic lighting with bold composition',
        characterName: 'Sample Character',
        characterOutfit: 1,
        sceneName: 'Studio Scene',
        projectId: 'default'
      }
    },
    {
      name: 'Short Prompt Test',
      params: {
        userPrompt: 'professional portrait',
        characterName: 'Sample Character',
        characterOutfit: 0,
        sceneName: 'Office Scene',
        projectId: 'default'
      }
    },
    {
      name: 'No Scene Test',
      params: {
        userPrompt: 'elegant business meeting setting',
        characterName: 'Sample Character',
        characterOutfit: 2,
        projectId: 'default'
      }
    },
    {
      name: 'Minimal Test',
      params: {
        userPrompt: 'headshot',
        projectId: 'default'
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n\n🧪 TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
    await testWordBudgetSystem(testCase.params);
    
    if (i < testCases.length - 1) {
      console.log('\n' + '─'.repeat(60));
    }
  }
  
  console.log('\n\n🎉 TEST SUITE COMPLETED');
  console.log('═'.repeat(60));
}

/**
 * Quick test with default values
 */
export async function quickTest(): Promise<void> {
  await testWordBudgetSystem({
    userPrompt: 'a person standing in dramatic lighting with bold composition',
    characterName: 'Sample Character',
    characterOutfit: 1,
    sceneName: 'Studio Scene',
    projectId: 'default'
  });
}
