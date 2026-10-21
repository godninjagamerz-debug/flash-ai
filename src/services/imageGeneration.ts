/**
 * Image Generation Service — Gemini Flash Image Generation
 * Routes through Supabase Edge Function to keep API key server-side.
 */

import { supabase } from '@/db/supabase';

interface ImagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiImageResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    };
    finishReason: string;
  }>;
}

/**
 * Call the image-generation edge function
 */
async function callImageGeneration(parts: ImagePart[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('image-generation', {
    body: {
      contents: [{ parts }],
    },
  });

  if (error) {
    const msg = typeof error?.context?.text === 'function'
      ? await error.context.text()
      : error.message;
    throw new Error(msg || 'Image generation failed');
  }

  const response = data as GeminiImageResponse;
  const parts_out = response?.candidates?.[0]?.content?.parts ?? [];

  // Find the inlineData image part
  const imgPart = parts_out.find((p) => p.inlineData?.data);
  if (!imgPart?.inlineData?.data) {
    throw new Error('No image returned from generation API');
  }
  return imgPart.inlineData.data;
}

/**
 * Generate image from text prompt
 */
export async function generateImageFromText(prompt: string): Promise<string> {
  return callImageGeneration([{ text: prompt }]);
}

/**
 * Generate image from existing image with text prompt
 */
export async function generateImageFromImage(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
  prompt: string
): Promise<string> {
  return callImageGeneration([
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ]);
}

/**
 * Generate image from multiple images with text prompt
 */
export async function generateImageFromMultipleImages(
  images: Array<{ base64: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' }>,
  prompt: string
): Promise<string> {
  return callImageGeneration([
    ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } })),
    { text: prompt },
  ]);
}

/**
 * Check if a prompt is requesting image generation
 */
export function isImageGenerationRequest(prompt: string): boolean {
  const keywords = [
    'generate image',
    'create image',
    'make image',
    'draw',
    'paint',
    'illustrate',
    'design',
    'picture of',
    'show me',
    'visualize',
    'render',
  ];

  const lowerPrompt = prompt.toLowerCase();
  return keywords.some((keyword) => lowerPrompt.includes(keyword));
}
