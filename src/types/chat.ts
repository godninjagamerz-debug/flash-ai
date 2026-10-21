export interface ImageAttachment {
  data: string;
  mimeType: string;
  name: string;
}

export interface MediaContent {
  type: 'image' | 'video';
  url?: string;
  data?: string;
  mimeType?: string;
  name?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  images?: ImageAttachment[];
  media?: MediaContent;
}

export interface ApiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ApiContent {
  role: 'user' | 'model';
  parts: ApiPart[];
}

export interface ApiRequest {
  contents: ApiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface ApiResponseCandidate {
  content: {
    role: string;
    parts: Array<{
      text: string;
    }>;
  };
  finishReason?: string;
  index?: number;
}

export interface ApiResponse {
  candidates: ApiResponseCandidate[];
}
