import { GoogleGenAI, Type } from '@google/genai';
import { DEFAULT_GEMINI_PROMPT, GEMINI_PROMPT_STORAGE_KEY } from './constants';

interface IconResponse {
  shape: string;
  color: string;
  label: string;
  svgPath?: string;
}

export async function generateImageWithGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Get custom prompt or use default
  const storedPrompt = localStorage.getItem(GEMINI_PROMPT_STORAGE_KEY);
  const systemPrompt = storedPrompt || DEFAULT_GEMINI_PROMPT;

  // Replace {prompt} placeholder with actual user prompt
  const fullPrompt = systemPrompt.replace('{prompt}', prompt);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shape: {
              type: Type.STRING,
              enum: ['circle', 'square', 'triangle', 'rounded'],
              description: 'The shape of the icon container',
            },
            color: {
              type: Type.STRING,
              description: 'A valid CSS color for the icon (e.g., #FF0000, blue, rgb(0,128,255))',
            },
            label: {
              type: Type.STRING,
              description: 'A 1-3 character abbreviation for the icon',
            },
            svgPath: {
              type: Type.STRING,
              description: 'Optional custom SVG path data for more complex icons',
              nullable: true,
            },
          },
          required: ['shape', 'color', 'label'],
          propertyOrdering: ['shape', 'color', 'label', 'svgPath'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text from Gemini');
    }
    const iconData: IconResponse = JSON.parse(responseText);

    if (!iconData.shape || !iconData.color || !iconData.label) {
      throw new Error('Invalid response: missing required fields');
    }

    return createSVGIcon(iconData);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

function createSVGIcon(data: IconResponse): string {
  const size = 200;
  let svgContent = '';

  // Use custom SVG path if provided, otherwise use default shapes
  if (data.svgPath) {
    svgContent = `<path d="${data.svgPath}" fill="${data.color}" transform="translate(${size / 2}, ${size / 2}) scale(${size / 400})"/>`;
  } else {
    switch (data.shape.toLowerCase()) {
      case 'circle':
        svgContent = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${data.color}"/>`;
        break;
      case 'square':
        svgContent = `<rect x="${size / 4}" y="${size / 4}" width="${size / 2}" height="${size / 2}" fill="${data.color}"/>`;
        break;
      case 'triangle':
        svgContent = `<polygon points="${size / 2},${size / 4} ${size / 4},${(size * 3) / 4} ${(size * 3) / 4},${(size * 3) / 4}" fill="${data.color}"/>`;
        break;
      case 'rounded':
        svgContent = `<rect x="${size / 4}" y="${size / 4}" width="${size / 2}" height="${size / 2}" rx="10" fill="${data.color}"/>`;
        break;
      default:
        throw new Error(`Invalid shape: ${data.shape}`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${svgContent}
    <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="middle" 
          fill="white" font-family="Arial, sans-serif" font-size="${size / 10}" font-weight="bold">
        ${data.label.substring(0, 3).toUpperCase()}
    </text>
</svg>`;

  // Convert SVG to data URL
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}
