export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SelectionMode = 'BOX' | 'BRUSH';

export interface DesignHistoryItem {
  id: string;
  originalImage: string; // Base64
  generatedImage: string; // Base64
  prompt: string;
  style: string;
  timestamp: number;
}

export enum DesignStyle {
  Modern = 'Modern',
  Minimalist = 'Minimalist',
  Scandinavian = 'Scandinavian',
  Bohemian = 'Bohemian',
  Industrial = 'Industrial',
  Japandi = 'Japandi',
  MidCenturyModern = 'Mid-Century Modern',
  Luxury = 'Modern Luxury',
  Cyberpunk = 'Cyberpunk',
}

export type AppState = 'IDLE' | 'EDITING' | 'GENERATING' | 'REVIEW';
