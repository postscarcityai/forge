import { NextRequest, NextResponse } from 'next/server';
// Updated to use centralized PromptService
import { promptService } from '@/services/PromptService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userPrompt = 'professional portrait', 
      characterName, 
      characterOutfit,
      sceneName,
      projectId = 'default' 
    } = body;

    console.log('\n🧪 TESTING 9-COMPONENT WORD BUDGET SYSTEM');
    console.log('═'.repeat(60));
    console.log(`📝 User Prompt: "${userPrompt}"`);
    console.log(`👤 Character: ${characterName || 'None'}`);
    console.log(`👕 Outfit: ${characterOutfit ?? 'Default'}`);
    console.log(`🎬 Scene: ${sceneName || 'None'}`);
    console.log(`📁 Project: ${projectId}`);
    console.log('═'.repeat(60));

    // Build structured prompt using the centralized PromptService
    const result = await promptService.buildPrompt({
      userPrompt,
      characterNames: characterName ? [characterName] : [],
      characterOutfits: characterOutfit !== undefined ? [characterOutfit] : [],
      sceneName,
      projectId
    });

    console.log('\n📝 FINAL PROMPT:');
    console.log('─'.repeat(60));
    console.log(result.prompt);
    console.log('─'.repeat(60));

    console.log('\n✅ SUMMARY:');
    console.log(`📈 Total Words: ${result.wordCount}/384`);
    console.log(`🎯 Compliance: ${result.budgetReport.isCompliant ? '✅ PASS' : '❌ FAIL'}`);
    if (result.budgetReport.overageWords > 0) {
      console.log(`⚠️ Overage: ${result.budgetReport.overageWords} words`);
    }

    // Return detailed breakdown
    return NextResponse.json({
      success: true,
      data: {
        prompt: result.prompt,
        wordCount: result.wordCount,
        targetWords: 384,
        compliance: result.budgetReport.isCompliant,
        overageWords: result.budgetReport.overageWords,
        components: result.budgetReport.components.map((componentReport) => {
          return {
            name: componentReport.label,
            content: componentReport.content.trim(),
            actualWords: componentReport.actualWords,
            budgetWords: componentReport.budgetWords,
            utilizationPercentage: Math.round(componentReport.percentage),
            compliance: componentReport.isCompliant,
            overageWords: componentReport.overageWords
          };
        }),
        budgetBreakdown: result.budgetReport.components.reduce((acc, comp) => {
          acc[comp.id] = comp;
          return acc;
        }, {} as Record<string, any>)
      },
      message: `Word budget test completed: ${result.wordCount}/384 words (${result.budgetReport.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'})`
    });

  } catch (error) {
    console.error('❌ Word budget test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Word budget test failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Quick test with default values
  const searchParams = request.nextUrl.searchParams;
  const userPrompt = searchParams.get('prompt') || 'a person standing in dramatic lighting with bold composition';
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt,
      projectId: 'default'
    })
  }));
} 