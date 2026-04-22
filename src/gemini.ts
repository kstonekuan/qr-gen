import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PROMPT,
  GEMINI_MODEL_STORAGE_KEY,
  GEMINI_PROMPT_STORAGE_KEY,
} from './constants';

type IconResponse = {
  svgPath: string;
  color: string | null;
  viewBox: string | null;
};

function parseIconResponse(raw: string): IconResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Gemini returned non-JSON response');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Gemini response was not an object');
  }

  const record = parsed as { svgPath?: unknown; color?: unknown; viewBox?: unknown };
  const { svgPath, color, viewBox } = record;
  if (typeof svgPath !== 'string' || svgPath.length === 0) {
    throw new Error('Gemini response is missing svgPath');
  }

  return {
    svgPath,
    color: typeof color === 'string' ? color : null,
    viewBox: typeof viewBox === 'string' ? viewBox : null,
  };
}

let lastGeneratedIconUrl: string | null = null;

export async function generateImageWithGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = localStorage.getItem(GEMINI_PROMPT_STORAGE_KEY) || DEFAULT_GEMINI_PROMPT;
  const model = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL;
  const fullPrompt = systemPrompt.replace('{prompt}', prompt);

  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          svgPath: { type: Type.STRING, description: 'SVG path data for the icon' },
          color: {
            type: Type.STRING,
            description: 'Color for the icon (hex or CSS color)',
            nullable: true,
          },
          viewBox: {
            type: Type.STRING,
            description: 'SVG viewBox dimensions',
            nullable: true,
          },
        },
        required: ['svgPath'],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('No response text from Gemini');
  }

  const iconData = parseIconResponse(responseText);
  return createSVGIcon(iconData);
}

function createSVGIcon(data: IconResponse): string {
  const size = 200;
  const viewBox = data.viewBox ?? '0 0 24 24';
  const color = data.color ?? '#000000';

  const [viewBoxX = '0', viewBoxY = '0', viewBoxWidth = '24', viewBoxHeight = '24'] =
    viewBox.split(' ');
  const originalWidth = Number.parseFloat(viewBoxWidth) - Number.parseFloat(viewBoxX);
  const originalHeight = Number.parseFloat(viewBoxHeight) - Number.parseFloat(viewBoxY);

  // 0.8 leaves 10% padding on each side so the glyph never touches the edge.
  const scale = Math.min(size / originalWidth, size / originalHeight) * 0.8;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${size / 2}, ${size / 2})">
      <g transform="scale(${scale}) translate(${-originalWidth / 2}, ${-originalHeight / 2})">
        <path d="${data.svgPath}" fill="${color}"/>
      </g>
    </g>
</svg>`;

  // Revoke the previous blob so generating multiple icons doesn't leak URLs.
  if (lastGeneratedIconUrl) {
    URL.revokeObjectURL(lastGeneratedIconUrl);
  }
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  lastGeneratedIconUrl = url;
  return url;
}
