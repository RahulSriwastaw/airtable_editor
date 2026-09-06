import { CustomInvertConfig, MultiColorInvertPreset } from './studioTypes';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): RgbColor => {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
};

export interface InvertPresetOption {
  id: MultiColorInvertPreset;
  name: string;
  nameHi: string;
  description: string;
  bgHex: string;
  fgHex: string;
  previewBg: string;
  previewFg: string;
}

export const MULTI_COLOR_INVERT_PRESETS: InvertPresetOption[] = [
  {
    id: 'classic_negative',
    name: 'Classic Negative',
    nameHi: 'क्लासिक निगेटिव (ब्लैक & व्हाइट)',
    description: 'Direct RGB complement invert (Pure B&W)',
    bgHex: '#000000',
    fgHex: '#ffffff',
    previewBg: '#0f172a',
    previewFg: '#ffffff'
  },
  {
    id: 'blueprint_navy',
    name: 'Dark Blueprint',
    nameHi: 'डार्क ब्लूप्रिंट (नेवी ब्लू & आइस वाइट)',
    description: 'Engineering dark navy background with ice-white & cyan diagram lines',
    bgHex: '#0b1d3a',
    fgHex: '#38bdf8',
    previewBg: '#0b1d3a',
    previewFg: '#38bdf8'
  },
  {
    id: 'chalkboard_slate',
    name: 'Blackboard / Slate',
    nameHi: 'चॉकबोर्ड स्लेट (डार्क चारकोल & चॉक)',
    description: 'Matte charcoal chalkboard with clean chalk-white lines',
    bgHex: '#18181b',
    fgHex: '#f8fafc',
    previewBg: '#18181b',
    previewFg: '#f8fafc'
  },
  {
    id: 'matrix_emerald',
    name: 'Cyber Matrix Emerald',
    nameHi: 'साइबर एमराल्ड ग्रीन (हाई कंट्रास्ट)',
    description: 'High contrast vibrant neon green diagram on deep dark canvas',
    bgHex: '#020617',
    fgHex: '#10b981',
    previewBg: '#020617',
    previewFg: '#10b981'
  },
  {
    id: 'amber_espresso',
    name: 'Amber Gold / Night',
    nameHi: 'एम्बर गोल्ड / वार्म नाइट',
    description: 'Warm eye-safe dark espresso background with golden amber lines',
    bgHex: '#1c1917',
    fgHex: '#f59e0b',
    previewBg: '#1c1917',
    previewFg: '#f59e0b'
  },
  {
    id: 'ruby_crimson',
    name: 'Ruby Crimson / Dark',
    nameHi: 'रूबी क्रिम्सन / महोगनी',
    description: 'Rich dark maroon background with rose & peach highlighted lines',
    bgHex: '#2a0812',
    fgHex: '#fda4af',
    previewBg: '#2a0812',
    previewFg: '#fda4af'
  },
  {
    id: 'vintage_sepia',
    name: 'Vintage Sepia Dark',
    nameHi: 'विंटेज सेपिया / डार्क पार्चमेंट',
    description: 'Warm walnut background with antique parchment cream lines',
    bgHex: '#271b10',
    fgHex: '#fef3c7',
    previewBg: '#271b10',
    previewFg: '#fef3c7'
  },
  {
    id: 'custom_dual',
    name: 'Custom Dual-Color',
    nameHi: 'कस्टम दो-रंग (मनचाहा रंग चुनें)',
    description: 'Pick any custom background color and line color freely',
    bgHex: '#0f172a',
    fgHex: '#60a5fa',
    previewBg: '#0f172a',
    previewFg: '#60a5fa'
  }
];

/**
 * Apply multi-color inversion and tone mapping on ImageData
 */
export function applyMultiColorInvertToImageData(
  srcData: Uint8ClampedArray,
  destData: Uint8ClampedArray,
  config: CustomInvertConfig
) {
  const { preset, bgColor, fgColor, contrast, threshold, invertMode, intensity } = config;
  const blendFactor = Math.max(0, Math.min(100, intensity)) / 100;

  if (preset === 'none' || blendFactor === 0) {
    for (let i = 0; i < srcData.length; i++) {
      destData[i] = srcData[i];
    }
    return;
  }

  // Classic Negative Mode
  if (preset === 'classic_negative') {
    for (let i = 0; i < srcData.length; i += 4) {
      const a = srcData[i + 3];
      if (a === 0) {
        destData[i] = 0;
        destData[i + 1] = 0;
        destData[i + 2] = 0;
        destData[i + 3] = 0;
        continue;
      }
      const invR = 255 - srcData[i];
      const invG = 255 - srcData[i + 1];
      const invB = 255 - srcData[i + 2];

      destData[i] = Math.round(srcData[i] * (1 - blendFactor) + invR * blendFactor);
      destData[i + 1] = Math.round(srcData[i + 1] * (1 - blendFactor) + invG * blendFactor);
      destData[i + 2] = Math.round(srcData[i + 2] * (1 - blendFactor) + invB * blendFactor);
      destData[i + 3] = a;
    }
    return;
  }

  // Multi-Color / Custom Dual-Color Luminance Remapping
  const targetBg = hexToRgb(bgColor);
  const targetFg = hexToRgb(fgColor);
  const cFactor = (contrast + 100) / 100; // 0 to 2

  for (let i = 0; i < srcData.length; i += 4) {
    const r = srcData[i];
    const g = srcData[i + 1];
    const b = srcData[i + 2];
    const a = srcData[i + 3];

    if (a === 0) {
      destData[i] = 0;
      destData[i + 1] = 0;
      destData[i + 2] = 0;
      destData[i + 3] = 0;
      continue;
    }

    // Standard Perceived Luminance [0 to 1]
    let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Apply Contrast
    if (cFactor !== 1) {
      lum = (lum - 0.5) * cFactor + 0.5;
      lum = Math.max(0, Math.min(1, lum));
    }

    // Optional Binarize Threshold
    if (threshold > 0) {
      const threshVal = threshold / 255;
      lum = lum >= threshVal ? 1 : 0;
    }

    // Invert light paper (lum near 1) -> background color, dark diagram ink (lum near 0) -> foreground color
    let t: number;
    if (invertMode === 'light_to_dark') {
      // Light background paper (lum ~ 1) maps to targetBg (weight 1)
      // Dark lines (lum ~ 0) map to targetFg (weight 1)
      t = lum; // 1 = background, 0 = foreground
    } else {
      // Dark background paper (lum ~ 0) maps to targetBg
      // Light lines (lum ~ 1) map to targetFg
      t = 1 - lum;
    }

    // Smooth Anti-Aliased Interpolation
    const outR = targetBg.r * t + targetFg.r * (1 - t);
    const outG = targetBg.g * t + targetFg.g * (1 - t);
    const outB = targetBg.b * t + targetFg.b * (1 - t);

    // Blend with original based on intensity
    destData[i] = Math.max(0, Math.min(255, Math.round(r * (1 - blendFactor) + outR * blendFactor)));
    destData[i + 1] = Math.max(0, Math.min(255, Math.round(g * (1 - blendFactor) + outG * blendFactor)));
    destData[i + 2] = Math.max(0, Math.min(255, Math.round(b * (1 - blendFactor) + outB * blendFactor)));
    destData[i + 3] = a;
  }
}
