/**
 * Content Moderation Service
 * Handles harmful, inappropriate, or unhelpful prompts gracefully
 */

interface ModerationResult {
  isAppropriate: boolean;
  sanitizedPrompt: string;
  warningMessage?: string;
  category?: 'harmful' | 'inappropriate' | 'unclear' | 'safe';
}

/**
 * List of harmful keywords and patterns
 */
const HARMFUL_PATTERNS = [
  // Violence
  /\b(kill|murder|harm|hurt|attack|weapon|bomb|explosive)\b/i,
  // Illegal activities
  /\b(hack|steal|fraud|scam|illegal|drug|cocaine|heroin)\b/i,
  // Hate speech
  /\b(hate|racist|sexist|discriminat)\b/i,
  // Self-harm
  /\b(suicide|self-harm|cut myself)\b/i,
  // Adult content
  /\b(porn|xxx|sex|nude|naked)\b/i,
];

/**
 * Helpful response templates for different categories
 */
const HELPFUL_RESPONSES = {
  harmful: "I understand you're looking for information, but I'm designed to provide helpful and safe responses. Let me help you with something constructive instead. What would you like to learn about or create today?",
  inappropriate: "I appreciate your interest, but I'm here to assist with positive and constructive tasks. How about we explore something creative or educational instead?",
  unclear: "I'd love to help you! Could you provide more details about what you're looking for? The more specific you are, the better I can assist you.",
  safe: "",
};

/**
 * Sanitize harmful prompts into constructive ones
 */
function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;

  // Replace harmful keywords with neutral alternatives
  const replacements: Record<string, string> = {
    kill: 'stop',
    murder: 'prevent',
    harm: 'help',
    hurt: 'care for',
    attack: 'defend',
    weapon: 'tool',
    bomb: 'firework',
    hack: 'learn about',
    steal: 'borrow',
    fraud: 'mistake',
    hate: 'dislike',
  };

  Object.entries(replacements).forEach(([harmful, safe]) => {
    const regex = new RegExp(`\\b${harmful}\\b`, 'gi');
    sanitized = sanitized.replace(regex, safe);
  });

  return sanitized;
}

/**
 * Detect if prompt contains harmful content
 */
function detectHarmfulContent(prompt: string): boolean {
  return HARMFUL_PATTERNS.some((pattern) => pattern.test(prompt));
}

/**
 * Detect if prompt is unclear or too vague
 */
function isUnclearPrompt(prompt: string): boolean {
  const words = prompt.trim().split(/\s+/);
  return words.length < 3 || prompt.length < 10;
}

/**
 * Moderate user input and provide helpful guidance
 */
export function moderateContent(prompt: string): ModerationResult {
  const trimmedPrompt = prompt.trim();

  // Check for empty or very short prompts
  if (!trimmedPrompt || trimmedPrompt.length < 2) {
    return {
      isAppropriate: false,
      sanitizedPrompt: trimmedPrompt,
      warningMessage: "Please enter a message to get started. I'm here to help!",
      category: 'unclear',
    };
  }

  // Check for harmful content
  if (detectHarmfulContent(trimmedPrompt)) {
    return {
      isAppropriate: false,
      sanitizedPrompt: sanitizePrompt(trimmedPrompt),
      warningMessage: HELPFUL_RESPONSES.harmful,
      category: 'harmful',
    };
  }

  // Check for unclear prompts
  if (isUnclearPrompt(trimmedPrompt)) {
    return {
      isAppropriate: true,
      sanitizedPrompt: trimmedPrompt,
      warningMessage: HELPFUL_RESPONSES.unclear,
      category: 'unclear',
    };
  }

  // Prompt is safe and clear
  return {
    isAppropriate: true,
    sanitizedPrompt: trimmedPrompt,
    category: 'safe',
  };
}

/**
 * Generate a helpful alternative suggestion
 */
export function generateAlternativeSuggestion(category: string): string[] {
  const suggestions: Record<string, string[]> = {
    harmful: [
      'Tell me about space exploration',
      'Explain how renewable energy works',
      'Create a beautiful landscape image',
      'Help me learn a new skill',
    ],
    inappropriate: [
      'Generate a creative story',
      'Explain a scientific concept',
      'Create artwork inspiration',
      'Help with a coding problem',
    ],
    unclear: [
      'Be more specific about what you want to know',
      'Describe the image or video you want to create',
      'Ask a detailed question about a topic',
      'Provide context for better assistance',
    ],
  };

  return suggestions[category] || suggestions.unclear;
}

/**
 * Check if user has permission for advanced features
 */
export function checkFeaturePermission(
  feature: 'image_generation' | 'video_generation' | 'advanced_ai',
  userPlan: string
): { allowed: boolean; message?: string } {
  const permissions: Record<string, string[]> = {
    image_generation: ['pro', 'business'],
    video_generation: ['pro', 'business'],
    advanced_ai: ['pro', 'business'],
  };

  const allowedPlans = permissions[feature] || [];
  const allowed = allowedPlans.includes(userPlan);

  if (!allowed) {
    const messages: Record<string, string> = {
      image_generation: 'Image generation is available for Pro and Business plans. Upgrade to unlock this feature!',
      video_generation: 'Video generation is available for Pro and Business plans. Upgrade to unlock this feature!',
      advanced_ai: 'Lightning McQueen AI is available for Pro and Business plans. Upgrade to unlock this feature!',
    };

    return {
      allowed: false,
      message: messages[feature],
    };
  }

  return { allowed: true };
}
