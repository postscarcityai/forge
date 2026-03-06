/**
 * Utility for providing standardized console feedback to LLMs
 * Used when API behavior needs to be communicated clearly to AI assistants
 */

interface LLMFeedbackOptions {
  title: string;
  technicalDetails: string;
  futureInstructions: string;
}

/**
 * Logs standardized feedback message for LLMs with consistent formatting
 * @param options - Object containing title, technical details, and future instructions
 */
export function llmFeedback({ title, technicalDetails, futureInstructions }: LLMFeedbackOptions): void {
  console.log(`\n🚫 ========================================`);
  console.log(`🚫 ${title}`);
  console.log(`🚫 ----------------------------------------`);
  console.log(`📋 ${technicalDetails}`);
  console.log(`🚫 ----------------------------------------`);
  console.log(`🤖 MESSAGE TO LLM: ${futureInstructions}`);
  console.log(`🚫 ========================================\n`);
} 