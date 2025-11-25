import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_GEMINI_PROMPT,
  GEMINI_MODEL_STORAGE_KEY,
  GEMINI_PROMPT_STORAGE_KEY,
} from './constants';

interface IconResponse {
  svgPath: string;
  color?: string;
  viewBox?: string;
}

export async function generateImageWithGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Get custom prompt or use default
  const storedPrompt = localStorage.getItem(GEMINI_PROMPT_STORAGE_KEY);
  const systemPrompt = storedPrompt || DEFAULT_GEMINI_PROMPT;

  // Get custom model or use default
  const storedModel = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  const model = storedModel || 'gemini-2.5-flash';

  // Replace {prompt} placeholder with actual user prompt
  const fullPrompt = systemPrompt.replace('{prompt}', prompt);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            svgPath: {
              type: Type.STRING,
              description: 'SVG path data for the icon',
            },
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
    const iconData: IconResponse = JSON.parse(responseText);

    if (!iconData.svgPath) {
      throw new Error('Invalid response: missing SVG path');
    }

    return createSVGIcon(iconData);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

function createSVGIcon(data: IconResponse): string {
  const size = 200;
  const viewBox = data.viewBox || '0 0 24 24';
  const color = data.color || '#000000';

  // Parse viewBox to get original dimensions
  const viewBoxParts = viewBox.split(' ');
  const originalWidth = Number.parseFloat(viewBoxParts[2]) - Number.parseFloat(viewBoxParts[0]);
  const originalHeight = Number.parseFloat(viewBoxParts[3]) - Number.parseFloat(viewBoxParts[1]);

  // Calculate scale to fit in our size
  const scale = Math.min(size / originalWidth, size / originalHeight) * 0.8; // 0.8 for padding

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${size / 2}, ${size / 2})">
      <g transform="scale(${scale}) translate(${-originalWidth / 2}, ${-originalHeight / 2})">
        <path d="${data.svgPath}" fill="${color}"/>
      </g>
    </g>
</svg>`;

  // Convert SVG to data URL
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}
