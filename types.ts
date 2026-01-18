
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PLANNING = 'PLANNING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface DirectorLog {
  id: string;
  phase: string;
  message: string;
  timestamp: number;
}

export interface ImageAnalysis {
  subject: string;
  style: string;
  lighting: string;
  keyElements: string;
  characterDNA: string; // Detailed physical attributes of the character
}

export interface StoryboardFramePlan {
  frameNumber: number;
  shotType: string;
  prompt: string;
  description: string;
}

export interface GeneratedFrame {
  id: number;
  imageUrl: string | null;
  plan: StoryboardFramePlan;
  status: 'pending' | 'generating' | 'done' | 'error';
}

export interface GenerationConfig {
  actionDescription: string;
  quality: 'standard' | 'cinematic';
  aspectRatio: '1:1' | '16:9' | '4:3';
}
