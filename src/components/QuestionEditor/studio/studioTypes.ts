export type ImageStudioTab = 'resize' | 'crop' | 'adjust' | 'invert' | 'bg_remove' | 'watermark' | 'draw' | 'shapes' | 'text';

export interface StudioImageItem {
  id?: string;
  url: string;
  title?: string;
  subtitle?: string;
  questionNumber?: number | string;
  recordId?: string;
  field?: string;
  onSave?: (newUrl: string) => void | Promise<void>;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  hasBackground: boolean;
  bgColor: string;
  isBold: boolean;
}

export type MultiColorInvertPreset = 
  | 'none'
  | 'classic_negative'
  | 'blueprint_navy'
  | 'chalkboard_slate'
  | 'matrix_emerald'
  | 'amber_espresso'
  | 'ruby_crimson'
  | 'vintage_sepia'
  | 'custom_dual';

export interface CustomInvertConfig {
  preset: MultiColorInvertPreset;
  bgColor: string;
  fgColor: string;
  contrast: number; // 0 to 100
  threshold: number; // 0 to 255
  invertMode: 'light_to_dark' | 'dark_to_light';
  intensity: number; // 0 to 100%
}
