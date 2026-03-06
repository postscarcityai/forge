# LLM Feedback Utilities - API Developer Tools

## 🤖 Overview

The Forge API includes specialized utilities for providing standardized feedback to Large Language Models (LLMs) during development and debugging. These tools help AI assistants understand API behavior and adjust their future interactions accordingly.

## 📋 llmFeedback Component

### Purpose

The `llmFeedback` utility provides consistent, prominent console logging when API endpoints intentionally ignore or override parameters. This is particularly useful for:

- **Parameter Validation**: Informing LLMs when certain parameters are ignored in favor of project settings
- **API Behavior Communication**: Clearly explaining why certain inputs are overridden
- **Development Feedback**: Providing actionable guidance for future API calls

### Location

```
src/utils/llmFeedback.ts
```

### Usage

```typescript
import { llmFeedback } from '@/utils/llmFeedback'

llmFeedback({
  title: 'IGNORING PROVIDED IMAGE_SIZE PARAMETER',
  technicalDetails: 'Requested: square | Using project default: portrait_16_9',
  futureInstructions: 'Do not include image_size in future API calls. It is always ignored in favor of project settings.'
})
```

### API Signature

```typescript
interface LLMFeedbackOptions {
  title: string;              // Main heading describing what happened
  technicalDetails: string;   // Specific technical information about the override
  futureInstructions: string; // Clear guidance for future LLM behavior
}

function llmFeedback(options: LLMFeedbackOptions): void
```

### Console Output Format

```
🚫 ========================================
🚫 IGNORING PROVIDED IMAGE_SIZE PARAMETER
🚫 ----------------------------------------
📋 Requested: square | Using project default: portrait_16_9
🚫 ----------------------------------------
🤖 MESSAGE TO LLM: Do not include image_size in future API calls. It is always ignored in favor of project settings.
🚫 ========================================
```

## 🎯 Current Implementations

### Image Generation APIs

The `llmFeedback` component is currently implemented across all image generation endpoints:

#### **Flux-LoRA Single** (`/api/flux-lora`)
- **Triggers**: When `image_size` parameter is provided
- **Message**: Informs that image sizing is controlled by project settings
- **Guidance**: Instructs to omit `image_size` parameter in future calls

#### **Flux-LoRA Batch** (`/api/flux-lora/batch-generate`)  
- **Triggers**: Always runs for batch requests
- **Message**: Explains that project settings override individual sizing
- **Guidance**: Recommends not including `image_size` in batch requests

#### **Flux-Kontext Single** (`/api/flux-kontext`)
- **Triggers**: When `aspect_ratio` parameter is provided  
- **Message**: Informs that aspect ratios are controlled by project settings
- **Guidance**: Instructs to omit `aspect_ratio` parameter in future calls

#### **Flux-Kontext Batch** (`/api/flux-kontext/batch-generate`)
- **Triggers**: When `aspect_ratio` parameter is provided in batch requests
- **Message**: Explains that project settings override individual aspect ratios
- **Guidance**: Recommends not including `aspect_ratio` in batch requests

## 💡 Design Principles

### Visibility
- **Prominent formatting** with clear visual separators
- **Emoji indicators** for quick scanning (🚫 for blocks, 📋 for details, 🤖 for LLM guidance)
- **Consistent spacing** for readability in console logs

### Clarity
- **Three-section structure**: Title → Technical Details → Future Instructions
- **Specific technical information** (what was requested vs. what was used)
- **Actionable guidance** for AI assistants

### Consistency
- **Standardized format** across all API endpoints
- **Unified messaging** for similar parameter overrides
- **Reusable component** for future feedback needs

## 🔧 Development Guidelines

### When to Use llmFeedback

Use `llmFeedback` when:
- ✅ An API parameter is intentionally ignored or overridden
- ✅ LLM behavior needs to be corrected for future calls
- ✅ Complex API behavior needs clear explanation
- ✅ Development debugging requires prominent logging

### When NOT to Use llmFeedback

Avoid `llmFeedback` for:
- ❌ Regular informational logging (use `console.log`)
- ❌ Error messages (use proper error handling)
- ❌ Debug information not related to LLM guidance
- ❌ Frequent/noisy logging that would clutter console

### Message Writing Best Practices

#### Title
- Use ALL CAPS for emphasis
- Be specific about what's happening
- Start with action verb (IGNORING, OVERRIDING, etc.)

#### Technical Details
- Include what was requested vs. what was used
- Use pipe separator (`|`) for clear comparisons
- Be specific with parameter names and values

#### Future Instructions
- Start with "Do not include..." for clarity
- Explain WHY the parameter is ignored
- Provide actionable guidance

### Example Messages

```typescript
// Good: Specific and actionable
llmFeedback({
  title: 'OVERRIDING PROVIDED LORA SETTINGS',
  technicalDetails: 'Requested 3 LoRAs | Using project default: 2 LoRAs',
  futureInstructions: 'Project LoRA settings always take precedence. Do not specify custom LoRAs unless testing.'
})

// Bad: Vague and not actionable
llmFeedback({
  title: 'SOMETHING WENT WRONG',
  technicalDetails: 'There was an issue',
  futureInstructions: 'Try again later.'
})
```

## 🚀 Future Enhancements

### Potential Extensions
- **Log Levels**: Support for different verbosity levels
- **Categorization**: Group feedback by API category or severity
- **Integration**: Send feedback to external logging services
- **Analytics**: Track common LLM parameter override patterns

### Expandable Use Cases
- **Authentication feedback**: When API keys are overridden
- **Rate limiting guidance**: When requests are throttled
- **Model selection**: When AI models are auto-selected
- **Cost optimization**: When expensive parameters are adjusted

---

*This documentation covers the llmFeedback utility as implemented in June 2025. For the most current API behavior, refer to the source code in `src/utils/llmFeedback.ts`.* 