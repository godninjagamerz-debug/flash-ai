/**
 * Video Generation Service — Kling Omni API
 * Supports text-to-video and image-to-video with sound ON, duration up to 15s.
 * Routes through Supabase Edge Functions to keep API key server-side.
 */

import { supabase } from '@/db/supabase';

export type VideoDuration = '5' | '10' | '15';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type VideoTaskStatus = 'submitted' | 'processing' | 'succeed' | 'failed';

interface OmniVideoTaskData {
  task_id: string;
  task_status: VideoTaskStatus;
  task_status_msg?: string;
  task_result?: {
    videos: Array<{ id: string; url: string; duration: string }>;
  };
}

/**
 * Submit a text-to-video task (with sound ON by default)
 */
export async function generateVideoFromText(
  prompt: string,
  options: {
    duration?: VideoDuration;
    aspectRatio?: VideoAspectRatio;
    negativePrompt?: string;
  } = {}
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('kling-omni-video-submit', {
    body: {
      prompt,
      duration: options.duration || '5',
      aspect_ratio: options.aspectRatio || '16:9',
      sound: 'on',
      ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
    },
  });

  if (error) {
    const msg = await error?.context?.text?.();
    throw new Error(msg || error.message || 'Video submission failed');
  }
  if (data.code !== 0) throw new Error(data.message || 'Video submission failed');
  return data.data.task_id as string;
}

/**
 * Submit an image-to-video task (image provided as base64 or URL)
 */
export async function generateVideoFromImage(
  imageBase64OrUrl: string,
  prompt: string,
  options: {
    duration?: VideoDuration;
    aspectRatio?: VideoAspectRatio;
  } = {}
): Promise<string> {
  const isUrl = imageBase64OrUrl.startsWith('http');
  const { data, error } = await supabase.functions.invoke('kling-omni-video-submit', {
    body: {
      prompt,
      duration: options.duration || '5',
      aspect_ratio: options.aspectRatio || '16:9',
      sound: 'on',
      image_list: [
        isUrl
          ? { image_url: imageBase64OrUrl }
          : { image_base64: imageBase64OrUrl },
      ],
    },
  });

  if (error) {
    const msg = await error?.context?.text?.();
    throw new Error(msg || error.message || 'Video submission failed');
  }
  if (data.code !== 0) throw new Error(data.message || 'Video submission failed');
  return data.data.task_id as string;
}

/**
 * Query the status of a video task
 */
export async function queryVideoTask(taskId: string): Promise<OmniVideoTaskData> {
  const { data, error } = await supabase.functions.invoke('kling-omni-video-query', {
    body: { task_id: taskId },
  });

  if (error) {
    const msg = await error?.context?.text?.();
    throw new Error(msg || error.message || 'Video query failed');
  }
  if (data.code !== 0) throw new Error(data.message || 'Video query failed');
  return data.data as OmniVideoTaskData;
}

/**
 * Poll a video task until it succeeds or fails (max 10 minutes, 7s interval)
 */
export async function pollVideoTask(
  taskId: string,
  onProgress?: (status: VideoTaskStatus) => void
): Promise<string> {
  const POLL_INTERVAL = 7000;
  const TIMEOUT = 10 * 60 * 1000;
  const deadline = Date.now() + TIMEOUT;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const taskData = await queryVideoTask(taskId);
    onProgress?.(taskData.task_status);

    if (taskData.task_status === 'succeed') {
      const url = taskData.task_result?.videos?.[0]?.url;
      if (!url) throw new Error('Video URL not found in result');
      return url;
    }
    if (taskData.task_status === 'failed') {
      throw new Error(taskData.task_status_msg || 'Video generation failed');
    }
  }
  throw new Error('Video generation timed out (10 minutes exceeded)');
}

/**
 * Detect whether a message is requesting video generation
 */
export function isVideoGenerationRequest(prompt: string): boolean {
  const keywords = [
    'generate video', 'create video', 'make video', 'make a video',
    'video of', 'animate', 'animation', 'make it move', 'moving',
    'motion video', 'video clip', 'short video',
  ];
  const lower = prompt.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

