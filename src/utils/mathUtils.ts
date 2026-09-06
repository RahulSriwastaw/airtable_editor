import katex from 'katex';

/**
 * Common Greek Letters mapping
 */
const GREEK_LETTERS: Record<string, string> = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\vartheta': 'θ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'µ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\pi': 'π',
  '\\varpi': 'ϖ',
  '\\rho': 'ρ',
  '\\varrho': 'ϱ',
  '\\sigma': 'σ',
  '\\varsigma': 'ς',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'φ',
  '\\varphi': 'ϕ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  '\\Gamma': 'Γ',
  '\\Delta': 'Δ',
  '\\Theta': 'Θ',
  '\\Lambda': 'Λ',
  '\\Xi': 'Ξ',
  '\\Pi': 'Π',
  '\\Sigma': 'Σ',
  '\\Upsilon': 'Υ',
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω'
};

/**
 * Common Math Operators & Symbols
 */
const MATH_SYMBOLS: Record<string, string> = {
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\approx': '≈',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\le': '≤',
  '\\leq': '≤',
  '\\ge': '≥',
  '\\geq': '≥',
  '\\equiv': '≡',
  '\\sim': '~',
  '\\cong': '≅',
  '\\propto': '∝',
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\supset': '⊃',
  '\\subseteq': '⊆',
  '\\supseteq': '⊇',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\emptyset': '∅',
  '\\angle': '∠',
  '\\triangle': '△',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\rightarrow': '→',
  '\\to': '→',
  '\\leftarrow': '←',
  '\\gets': '←',
  '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\iff': '⇔',
  '\\implies': '⇒',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\int': '∫',
  '\\oint': '∮',
  '\\degree': '°',
  '\\circ': '°',
  '\\dots': '...',
  '\\cdots': '⋯',
  '\\vdots': '⋮',
  '\\ddots': '⋱',
  '\\hbar': 'ℏ',
  '\\ell': 'ℓ'
};

/**
 * Math Functions (sin, cos, tan, log, etc.)
 */
const MATH_FUNCTIONS: Record<string, string> = {
  '\\sin': 'sin ',
  '\\cos': 'cos ',
  '\\tan': 'tan ',
  '\\cot': 'cot ',
  '\\sec': 'sec ',
  '\\csc': 'csc ',
  '\\arcsin': 'arcsin ',
  '\\arccos': 'arccos ',
  '\\arctan': 'arctan ',
  '\\sinh': 'sinh ',
  '\\cosh': 'cosh ',
  '\\tanh': 'tanh ',
  '\\log': 'log ',
  '\\ln': 'ln ',
  '\\exp': 'exp ',
  '\\lim': 'lim ',
  '\\max': 'max ',
  '\\min': 'min ',
  '\\det': 'det ',
  '\\gcd': 'gcd ',
  '\\deg': 'deg '
};

// Safe token markers using Unicode Private Use Area (PUA) characters
// They never match any ASCII math functions, LaTeX commands, or subscript/superscript regexes.
const HTML_TOKEN_PREFIX = '\uE000HTK';
const HTML_TOKEN_SUFFIX = '\uE001';
const URL_TOKEN_PREFIX = '\uE002UTK';
const URL_TOKEN_SUFFIX = '\uE003';

/**
 * Removes any leftover or corrupted HTML_TOKEN / URL_TOKEN artifacts
 * (e.g. __HTML_TOKEN₀__, ___HTML_TOKEN<sub>0</sub>___, etc.)
 */
export function cleanHtmlArtifactTokens(text: string): string {
  if (!text) return '';
  return text
    // 1. Remove legacy or corrupted HTML/URL tokens with Unicode subscripts, sub tags, or underscores
    .replace(/_{1,4}(?:HTML|URL)_TOKEN(?:<sub>[0-9]+<\/sub>|[0-9₀-₉_]+)*_{1,4}/gi, '')
    // 2. Remove any leftover internal PUA tokens if any
    .replace(/[\uE000-\uE003](?:HTK|UTK)?[0-9]*[\uE000-\uE003]/g, '')
    // 3. Unescape any leaked HTML tags (p, table, thead, tbody, tr, th, td, sub, sup, strong, b, i, img, etc.)
    .replace(/&lt;(\/?(?:p|b|i|u|strong|em|sub|sup|table|thead|tbody|tr|th|td|ul|ol|li|span|div|img|br)\b[^&]*)&gt;/gi, '<$1>')
    .replace(/&quot;/g, '"')
    // 4. Remove empty paragraphs left behind
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();
}

/**
 * Protects HTML tags, attributes, and URLs during LaTeX/Math parsing
 */
export function protectHtmlAndUrls(input: string): { text: string; tokens: string[] } {
  if (!input) return { text: '', tokens: [] };
  // First clean any preexisting corrupted tokens
  const cleanInput = cleanHtmlArtifactTokens(input);
  const tokens: string[] = [];

  // Protect HTML tags <...> using safe PUA markers
  let text = cleanInput.replace(/<[^>]+>/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `${HTML_TOKEN_PREFIX}${idx}${HTML_TOKEN_SUFFIX}`;
  });

  // Protect standalone URLs http:// or https:// using safe PUA markers
  text = text.replace(/https?:\/\/[^\s"'<>]+/gi, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `${URL_TOKEN_PREFIX}${idx}${URL_TOKEN_SUFFIX}`;
  });

  return { text, tokens };
}

/**
 * Restores protected HTML tags and URLs
 */
export function restoreProtectedTokens(text: string, tokens: string[]): string {
  if (!text) return '';
  let res = text;
  if (tokens && tokens.length > 0) {
    tokens.forEach((val, idx) => {
      // Restore PUA tokens
      res = res.split(`${HTML_TOKEN_PREFIX}${idx}${HTML_TOKEN_SUFFIX}`).join(val);
      res = res.split(`${URL_TOKEN_PREFIX}${idx}${URL_TOKEN_SUFFIX}`).join(val);
      // Also restore any legacy tokens if they somehow exist
      res = res.split(`___HTML_TOKEN_${idx}___`).join(val);
      res = res.split(`___HTML_TOKEN<sub>${idx}</sub>___`).join(val);
      res = res.split(`___URL_TOKEN_${idx}___`).join(val);
    });
  }
  // Clean any remaining dangling artifact tokens
  return cleanHtmlArtifactTokens(res);
}

/**
 * Repairs previously corrupted image URLs where '_' was converted into <sub> or &lt;sub&gt;
 */
export function repairCorruptedSubscriptsInUrls(html: string): string {
  if (!html) return '';
  // Check if string contains corrupted image src or URLs
  return html.replace(/(<img\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, url, suffix) => {
    let cleanUrl = url
      .replace(/&lt;sub&gt;([a-zA-Z0-9_-]+)&lt;\/sub&gt;/gi, '_$1')
      .replace(/<sub>([a-zA-Z0-9_-]+)<\/sub>/gi, '_$1')
      .replace(/&lt;sup&gt;([a-zA-Z0-9_-]+)&lt;\/sup&gt;/gi, '^$1')
      .replace(/<sup>([a-zA-Z0-9_-]+)<\/sup>/gi, '^$1')
      .replace(/&amp;/g, '&');
    return `${prefix}${cleanUrl}${suffix}`;
  }).replace(/(https?:\/\/[^\s"'<>]+)/gi, (match) => {
    return match
      .replace(/&lt;sub&gt;([a-zA-Z0-9_-]+)&lt;\/sub&gt;/gi, '_$1')
      .replace(/<sub>([a-zA-Z0-9_-]+)<\/sub>/gi, '_$1')
      .replace(/&lt;sup&gt;([a-zA-Z0-9_-]+)&lt;\/sup&gt;/gi, '^$1')
      .replace(/<sup>([a-zA-Z0-9_-]+)<\/sup>/gi, '^$1');
  });
}

/**
 * Utility to detect if a text contains raw LaTeX code, math delimiters, or unresolved slashes
 */
export function hasLatexCode(text: string): boolean {
  if (!text) return false;

  // If text has corrupted token artifacts, flag it so it gets automatically fixed
  if (/_{1,4}(?:HTML|URL)_TOKEN/i.test(text)) {
    return true;
  }

  // Strip HTML tags and URLs before inspecting text
  const pureText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/[^\s"'<>]+/gi, ' ')
    .trim();

  if (!pureText) return false;

  return (
    /\\\([^\)]+\\\)/.test(pureText) ||
    /\\\[[^\]]+\\\]/.test(pureText) ||
    /\$[^$]+\$/.test(pureText) ||
    /(\\sin|\\cos|\\tan|\\cot|\\sec|\\csc|\\theta|\\sqrt|\\alpha|\\beta|\\gamma|\\pi|\\circ|\\degree|\\times|\\div|\\pm|\\leq|\\geq|\\neq|\\approx|\\rightarrow|\\to|\\sum|\\prod|\\int|\\frac)/i.test(pureText) ||
    /\^\{\\circ\}|\^\\circ|\^\{\\degree\}|\^\\degree/.test(pureText) ||
    /(\w+)\_\{([0-9a-zA-Z\+\-]+)\}/.test(pureText) ||
    /(\w+)\^\{([0-9a-zA-Z\+\-]+)\}/.test(pureText) ||
    /\b(Ca|Mg|Na|K|Fe|Cu|Zn|Al|Cl|Br|O|H|N|C|S|P)[0-9]*\^[0-9]*[\+\-]/.test(pureText) ||
    /\b(Ca|Mg|Na|K|Fe|Cu|Zn|Al|H|O|N|C|S|P)_([0-9]+)\b/.test(pureText)
  );
}

/**
 * Converts any LaTeX math expressions into clean, formatted HTML (subscripts, superscripts, symbols)
 */
export function convertLatexToHtml(input: string): string {
  if (!input) return '';

  // 0. First auto-repair any corrupted image URLs & purge any artifact tokens in input
  const preCleaned = cleanHtmlArtifactTokens(input);
  const repaired = repairCorruptedSubscriptsInUrls(preCleaned);

  // 1. Protect all HTML tags and URLs from math regexes
  const { text, tokens } = protectHtmlAndUrls(repaired);

  let html = text;

  // 2. First replace explicit LaTeX delimiter wrappers \( ... \), \[ ... \], $ ... $
  const latexBlockRegex = /(\\\(([^\\]*?(\\[^)][^\\]*?)*?)\\\)|\\\[([\s\S]*?)\\\]|\$([^\$]+)\$)/g;
  html = html.replace(latexBlockRegex, (match, p1, p2, p3, p4, p5) => {
    let formula = p2 || p4 || p5 || match;
    formula = formula
      .replace(/^\\\(|\\\)$/g, '')
      .replace(/^\\\[|\\\]$/g, '')
      .replace(/^\$|\$$/g, '')
      .trim();
    return formatFormulaToHtml(formula);
  });

  // 3. Format parenthesized LaTeX expressions like (\sin\theta+\cos\theta) or (\sqrt2) or (\theta=45^\circ)
  html = html.replace(/\(([^)]*\\[a-zA-Z][^)]*)\)/g, (match, inner) => {
    return `(${formatFormulaToHtml(inner)})`;
  });

  // 4. Convert any remaining un-escaped LaTeX commands in raw text (e.g. \sin\theta, \sqrt2, 45^\circ, Ca^{2+})
  html = formatFormulaToHtml(html);

  // 5. Format chemical notations like CaF_2, H_2O, Ca^{2+}, F^-
  html = formatChemicalFormulas(html);

  // 6. Clean extra spaces
  html = html.replace(/\s{2,}/g, ' ');

  // 7. Restore all protected HTML tags & URLs verbatim and sanitize
  return restoreProtectedTokens(html, tokens);
}

/**
 * Formats a raw formula string or inline LaTeX into clean HTML
 */
export function formatFormulaToHtml(formula: string): string {
  if (!formula) return '';
  let res = formula;

  // 1. Text wrappers: \text{...}, \mathrm{...}, \mathbf{...}, etc.
  res = res.replace(/\\(text|mathrm|mathbf|mathit|textnormal|textbf|textit)\{([^}]*)\}/g, '$2');

  // 2. Degree symbols: 45^\circ, 45^{\circ}, 45^\degree, 45^{\degree}, ^\circ, ^{\circ}
  res = res.replace(/\^\{\\circ\}|\^\\circ|\^\{\\degree\}|\^\\degree/g, '°');
  res = res.replace(/([0-9]+)\s*\^\{\\circ\}/g, '$1°');
  res = res.replace(/([0-9]+)\s*\^\\circ/g, '$1°');
  res = res.replace(/([0-9]+)\s*\^\{\\degree\}/g, '$1°');
  res = res.replace(/([0-9]+)\s*\^\\degree/g, '$1°');
  res = res.replace(/\\degree|\\circ/g, '°');

  // 3. Square Roots: \sqrt[3]{x} -> ∛x, \sqrt{25} -> √25, \sqrt2 -> √2, \sqrt x -> √x
  res = res.replace(/\\sqrt\[3\]\s*\{([^}]+)\}/g, '∛($1)');
  res = res.replace(/\\sqrt\[3\]\s*([0-9a-zA-Z]+)/g, '∛$1');
  res = res.replace(/\\sqrt\[([0-9]+)\]\s*\{([^}]+)\}/g, '<sup>$1</sup>√($2)');
  res = res.replace(/\\sqrt\s*\{([^}]+)\}/g, '√($1)');
  res = res.replace(/\\sqrt\s*([0-9a-zA-Zα-ωΑ-Ω]+)/g, '√$1');

  // 4. Fractions: \frac{a}{b} -> <sup>a</sup>/<sub>b</sub> or a/b
  res = res.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '<sup>$1</sup>/<sub>$2</sub>');
  res = res.replace(/&frasl;|&#8260;/g, '/');

  // 5. Trigonometric and math functions: \sin\theta -> sin θ, \cos\theta -> cos θ
  Object.entries(MATH_FUNCTIONS).forEach(([symbol, readable]) => {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    res = res.replace(new RegExp(escaped + '(?=[a-zA-Z0-9α-ωΑ-Ω\(\\\\])', 'g'), readable);
    res = res.replace(new RegExp(escaped, 'g'), readable);
  });

  // 6. Greek letters: \theta -> θ, \alpha -> α, \pi -> π
  Object.entries(GREEK_LETTERS).forEach(([symbol, unicode]) => {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    res = res.replace(new RegExp(escaped + '(?![a-zA-Z])', 'g'), unicode);
  });

  // 7. Math symbols and operators: \times -> ×, \div -> ÷, \pm -> ±, \leq -> ≤
  Object.entries(MATH_SYMBOLS).forEach(([symbol, unicode]) => {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    res = res.replace(new RegExp(escaped + '(?![a-zA-Z])', 'g'), unicode);
  });

  // 8. Superscripts: ^{2+}, ^2, ^{+2}, ^-, ^{+}, ^x
  res = res.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  res = res.replace(/\^([0-9a-zA-Z\+\-\*])/g, '<sup>$1</sup>');

  // 9. Subscripts: _{2}, _2, _{aq}, _x (e.g. x_1, a_n)
  res = res.replace(/\_\{([^}]+)\}/g, '<sub>$1</sub>');
  res = res.replace(/\b([a-zA-Zα-ωΑ-Ω])\_([0-9a-zA-Z])\b/g, '$1<sub>$2</sub>');

  // 10. Clean up LaTeX spaces & redundant backslashes
  res = res.replace(/\\,/g, ' ');
  res = res.replace(/\\;/g, ' ');
  res = res.replace(/\\!/g, '');
  res = res.replace(/\\quad/g, '  ');
  res = res.replace(/\\qquad/g, '   ');
  res = res.replace(/\\([a-zA-Z]+)/g, '$1'); // any unrecognized leftover \func to func
  res = res.replace(/\\/g, ''); // stray backslashes

  // 11. Normalize operator spaces (e.g. sinθ -> sin θ, + / - / = spacing)
  res = res.replace(/(sin|cos|tan|cot|sec|csc|log|ln|lim)(θ|α|β|γ|x|y|z)/gi, '$1 $2');
  res = res.replace(/([0-9a-zA-Zα-ωΑ-Ω°\)])\s*([\+\-\=])\s*([0-9a-zA-Zα-ωΑ-Ω°\(\√])/g, '$1 $2 $3');

  return res;
}

/**
 * Finds chemical symbols like CaF_2, H_2O, Ca^{2+}, F^- even without \( \)
 */
export function formatChemicalFormulas(text: string): string {
  if (!text) return '';
  let res = text;

  // Replace Ca^{2+} or F^{-} or Na^{+}
  res = res.replace(/([A-Z][a-z]?)\^\{?([0-9]*[\+\-])\}?/g, '$1<sup>$2</sup>');

  // Replace Ca_2 or H_2O (avoid html tags)
  res = res.replace(/([A-Z][a-z]?)\_\{?([0-9]+)\}?/g, '$1<sub>$2</sub>');

  return res;
}

/**
 * Renders LaTeX using KaTeX for high-fidelity mathematical display
 */
export function renderKaTeXToString(latex: string, displayMode = false): string {
  try {
    const cleanLatex = latex
      .replace(/^\\\(|\\\)$/g, '')
      .replace(/^\\\[|\\\]$/g, '')
      .replace(/^\$|\$$/g, '')
      .trim();

    return katex.renderToString(cleanLatex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml'
    });
  } catch (err) {
    console.error('KaTeX rendering error:', err);
    return convertLatexToHtml(latex);
  }
}

/**
 * Strips HTML tags for clean text preview while keeping subscripts/superscripts readable
 */
export function htmlToCleanDisplay(html: string): string {
  if (!html) return '';
  return html
    .replace(/<sub>(.*?)<\/sub>/gi, '$1')
    .replace(/<sup>(.*?)<\/sup>/gi, '^$1')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Question field image detection result
 */
export interface QuestionImageDetail {
  field: string;
  fieldLabel: string;
  url: string;
  isImgbb: boolean;
}

export interface QuestionImageSummary {
  hasAnyImage: boolean;
  totalImages: number;
  unhostedImages: number;
  hostedImages: number;
  isFullyHosted: boolean;
  images: QuestionImageDetail[];
  locations: string[]; // e.g. ['Question (HI)', 'Option B (EN)', 'Solution (HI)', 'Diagram']
}

/**
 * Checks all fields of a question (question, options 1-5, solutions, image_url)
 * for images in either Hindi or English
 */
export function getQuestionImagesSummary(fields: Record<string, any> | undefined | null): QuestionImageSummary {
  if (!fields) {
    return { hasAnyImage: false, totalImages: 0, unhostedImages: 0, hostedImages: 0, isFullyHosted: false, images: [], locations: [] };
  }

  const images: QuestionImageDetail[] = [];
  const locationSet = new Set<string>();

  // 1. Check direct diagram image_url
  if (fields.image_url && typeof fields.image_url === 'string' && fields.image_url.trim().startsWith('http')) {
    const url = fields.image_url.trim();
    const isImgbb = url.includes('ibb.co') || url.includes('i.ibb.co');
    images.push({
      field: 'image_url',
      fieldLabel: 'Diagram Attachment',
      url,
      isImgbb
    });
    locationSet.add('Diagram');
  }

  // 2. Map of all HTML text fields
  const fieldMapping: { key: string; label: string; shortLoc: string }[] = [
    { key: 'question_hi', label: 'Question (Hindi)', shortLoc: 'Question (HI)' },
    { key: 'question_en', label: 'Question (English)', shortLoc: 'Question (EN)' },
    { key: 'option1_hi', label: 'Option 1/A (Hindi)', shortLoc: 'Option 1 (HI)' },
    { key: 'option2_hi', label: 'Option 2/B (Hindi)', shortLoc: 'Option 2 (HI)' },
    { key: 'option3_hi', label: 'Option 3/C (Hindi)', shortLoc: 'Option 3 (HI)' },
    { key: 'option4_hi', label: 'Option 4/D (Hindi)', shortLoc: 'Option 4 (HI)' },
    { key: 'option5_hi', label: 'Option 5/E (Hindi)', shortLoc: 'Option 5 (HI)' },
    { key: 'option1_en', label: 'Option 1/A (English)', shortLoc: 'Option 1 (EN)' },
    { key: 'option2_en', label: 'Option 2/B (English)', shortLoc: 'Option 2 (EN)' },
    { key: 'option3_en', label: 'Option 3/C (English)', shortLoc: 'Option 3 (EN)' },
    { key: 'option4_en', label: 'Option 4/D (English)', shortLoc: 'Option 4 (EN)' },
    { key: 'option5_en', label: 'Option 5/E (English)', shortLoc: 'Option 5 (EN)' },
    { key: 'solution_hi', label: 'Solution (Hindi)', shortLoc: 'Solution (HI)' },
    { key: 'solution_en', label: 'Solution (English)', shortLoc: 'Solution (EN)' }
  ];

  const imgRegex = /<img\b[^>]*?\bsrc=["'](https?:\/\/[^"'\s]+)["']/gi;

  fieldMapping.forEach(({ key, label, shortLoc }) => {
    const val = fields[key];
    if (typeof val === 'string' && val.includes('<img')) {
      let m;
      // Reset regex index
      imgRegex.lastIndex = 0;
      while ((m = imgRegex.exec(val)) !== null) {
        const url = m[1];
        const isImgbb = url.includes('ibb.co') || url.includes('i.ibb.co');
        images.push({
          field: key,
          fieldLabel: label,
          url,
          isImgbb
        });
        locationSet.add(shortLoc);
      }
    }
  });

  const unhostedImages = images.filter(i => !i.isImgbb).length;
  const hostedImages = images.filter(i => i.isImgbb).length;
  const hasAnyImage = images.length > 0;
  const isFullyHosted = hasAnyImage && unhostedImages === 0;

  return {
    hasAnyImage,
    totalImages: images.length,
    unhostedImages,
    hostedImages,
    isFullyHosted,
    images,
    locations: Array.from(locationSet)
  };
}
