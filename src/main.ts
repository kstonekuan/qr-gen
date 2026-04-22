import {
  API_KEY_STORAGE_KEY,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PROMPT,
  GEMINI_MODEL_STORAGE_KEY,
  GEMINI_PROMPT_STORAGE_KEY,
  QR_INPUT,
} from './constants';
import { findElement, requireButton, requireCanvas, requireInput, requireTextarea } from './dom';
import { generateImageWithGemini } from './gemini';
import { showModal } from './modal';
import { downloadQRCode, generateQRCode } from './qrCode';
import { checkRateLimit, incrementRateLimit, updateRateLimitDisplay } from './rateLimit';
import { type IconRender, parseTabType, type QRCodeFormConfig, type TabType } from './types';

let currentIcon: string | null = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeEventListeners();
  loadApiKey();
  loadSystemPrompt();
  loadModel();
  updateRateLimitDisplay();
});

function initializeTabs(): void {
  const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-button');
  const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = parseTabType(button.dataset['tab']);
      if (!targetTab) return;

      if (targetTab === 'generate' && !localStorage.getItem(API_KEY_STORAGE_KEY)) {
        showModal({
          type: 'warning',
          title: 'API Key Required',
          message:
            'Please configure your Gemini API key in the settings below to use AI generation.',
        });
        return;
      }

      activateTab(tabButtons, tabContents, button, targetTab);
    });
  });
}

function activateTab(
  tabButtons: NodeListOf<HTMLButtonElement>,
  tabContents: NodeListOf<HTMLDivElement>,
  activeButton: HTMLButtonElement,
  targetTab: TabType,
): void {
  tabButtons.forEach((btn) => {
    btn.classList.remove('active', 'bg-blue-600', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-600');
  });
  tabContents.forEach((content) => {
    content.classList.remove('active');
    content.classList.add('hidden');
  });

  activeButton.classList.add('active', 'bg-blue-600', 'text-white');
  activeButton.classList.remove('bg-gray-100', 'text-gray-600');
  const tabElement = findElement(`${targetTab}-tab`);
  if (tabElement) {
    tabElement.classList.add('active');
    tabElement.classList.remove('hidden');
  }
}

function initializeEventListeners(): void {
  const qrTextInput = requireInput('qr-text');
  requireButton('generate-qr').addEventListener('click', handleGenerateQRCode);
  requireButton('download-qr').addEventListener('click', handleDownloadQRCode);
  qrTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerateQRCode();
    }
  });

  requireInput('icon-upload').addEventListener('change', handleIconUpload);
  requireButton('clear-icon').addEventListener('click', clearIcon);

  requireButton('generate-icon').addEventListener('click', generateAIIcon);
  const aiPromptInput = requireInput('ai-prompt');
  aiPromptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateAIIcon();
    }
  });

  const apiKeyForm = findElement('api-key-form');
  apiKeyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveApiKey();
  });
  requireButton('clear-api-key').addEventListener('click', clearApiKey);

  requireButton('save-prompt').addEventListener('click', saveSystemPrompt);
  requireButton('reset-prompt').addEventListener('click', resetSystemPrompt);

  const modelInput = requireInput('gemini-model');
  modelInput.addEventListener('change', () => {
    const model = modelInput.value.trim();
    if (model) {
      localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
    }
  });

  setupSliderWithMidpointSnap(
    requireInput('square-size'),
    QR_INPUT.squareSize,
    'square-size-display',
    (v) => `${v}px`,
  );
  setupSliderWithMidpointSnap(
    requireInput('finder-rounding'),
    QR_INPUT.finderRounding,
    'finder-rounding-display',
    (v) => `${v}%`,
  );
  setupSliderWithMidpointSnap(
    requireInput('module-rounding'),
    QR_INPUT.moduleRounding,
    'module-rounding-display',
    (v) => `${v}%`,
  );

  const logoDisplay = findElement('logo-size-display');
  setupSliderWithMidpointSnap(
    requireInput('logo-size'),
    QR_INPUT.logoSize,
    'logo-size-display',
    (v) => `${v}%`,
    (value) => {
      if (!logoDisplay) return;
      // Logos larger than ~25% of the QR start degrading scannability even with the
      // error-correction-level-H the generator uses.
      if (value > 25) {
        logoDisplay.classList.add('text-amber-600');
        logoDisplay.setAttribute('title', 'Large logos may affect QR code scanning');
      } else {
        logoDisplay.classList.remove('text-amber-600');
        logoDisplay.removeAttribute('title');
      }
    },
  );

  setupSliderWithMidpointSnap(
    requireInput('border-size'),
    QR_INPUT.borderSize,
    'border-size-display',
    (v) => `${v}%`,
  );
  setupSliderWithMidpointSnap(
    requireInput('corner-radius'),
    QR_INPUT.cornerRadius,
    'corner-radius-display',
    (v) => `${v}%`,
  );

  const transparentCheckbox = requireInput('transparent-bg');
  const borderControl = findElement('border-size-control');
  transparentCheckbox.addEventListener('change', () => {
    if (!borderControl) return;
    if (transparentCheckbox.checked) {
      borderControl.classList.add('opacity-50', 'pointer-events-none');
    } else {
      borderControl.classList.remove('opacity-50', 'pointer-events-none');
    }
  });

  const roundedCheckbox = requireInput('logo-rounded');
  const cornerRadiusControl = findElement('corner-radius-control');
  roundedCheckbox.addEventListener('change', () => {
    if (!cornerRadiusControl) return;
    if (roundedCheckbox.checked) {
      cornerRadiusControl.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      cornerRadiusControl.classList.add('opacity-50', 'pointer-events-none');
    }
  });
}

// Velocity-based snapping for sliders: fast drags snap to min, midpoint, or max;
// slow drags allow fine control. Without this, trying to land on a round value
// like 50% while dragging fast is fiddly.
function setupSliderWithMidpointSnap(
  slider: HTMLInputElement,
  range: { readonly min: number; readonly max: number; readonly default: number },
  displayId: string,
  formatValue: (value: number) => string,
  onValueChange?: (value: number) => void,
): void {
  slider.min = String(range.min);
  slider.max = String(range.max);
  slider.value = String(range.default);

  const display = findElement(displayId);
  if (!display) return;
  display.textContent = formatValue(range.default);

  let lastValue = range.default;
  let lastTime = performance.now();

  const midpoint = (range.min + range.max) / 2;
  const rangeWidth = range.max - range.min;
  const snapPoints = [range.min, midpoint, range.max];

  const velocityThreshold = 0.001;
  const snapDistance = rangeWidth * 0.1;

  slider.addEventListener('input', () => {
    const currentValue = Number.parseFloat(slider.value);
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    const deltaValue = Math.abs(currentValue - lastValue);

    const velocity = deltaTime > 0 ? deltaValue / rangeWidth / deltaTime : 0;

    let finalValue = currentValue;

    if (velocity > velocityThreshold) {
      for (const snapPoint of snapPoints) {
        if (Math.abs(currentValue - snapPoint) < snapDistance) {
          finalValue = snapPoint;
          slider.value = String(snapPoint);
          break;
        }
      }
    }

    display.textContent = formatValue(finalValue);
    onValueChange?.(finalValue);

    lastValue = finalValue;
    lastTime = currentTime;
  });
}

function parseSliderInt(input: HTMLInputElement, fallback: number): number {
  const parsed = Number.parseInt(input.value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readIconRender(): IconRender | null {
  if (!currentIcon) return null;

  const logoSizeRatio = parseSliderInt(requireInput('logo-size'), QR_INPUT.logoSize.default) / 100;
  const transparentBg = requireInput('transparent-bg').checked;
  const borderSizePercent = parseSliderInt(
    requireInput('border-size'),
    QR_INPUT.borderSize.default,
  );
  const roundedCorners = requireInput('logo-rounded').checked;
  const cornerRadiusPercent = parseSliderInt(
    requireInput('corner-radius'),
    QR_INPUT.cornerRadius.default,
  );

  return {
    src: currentIcon,
    sizeRatio: logoSizeRatio,
    border: transparentBg ? { kind: 'none' } : { kind: 'opaque', sizePercent: borderSizePercent },
    corners: roundedCorners
      ? { kind: 'rounded', radiusPercent: cornerRadiusPercent }
      : { kind: 'sharp' },
  };
}

function readQRCodeFormConfig(): QRCodeFormConfig | null {
  const text = requireInput('qr-text').value.trim();
  if (!text) return null;

  return {
    text,
    moduleSize: parseSliderInt(requireInput('square-size'), QR_INPUT.squareSize.default),
    finderRoundingPercent: parseSliderInt(
      requireInput('finder-rounding'),
      QR_INPUT.finderRounding.default,
    ),
    moduleRoundingPercent: parseSliderInt(
      requireInput('module-rounding'),
      QR_INPUT.moduleRounding.default,
    ),
    icon: readIconRender(),
  };
}

function handleIconUpload(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (typeof result === 'string') {
      currentIcon = result;
      displayIcon(result, 'upload-preview');
    }
  };
  reader.readAsDataURL(file);
}

function displayIcon(src: string, containerId: string): void {
  const container = findElement(containerId);
  if (container) {
    container.innerHTML = `<img src="${src}" alt="Icon preview" class="max-w-[100px] max-h-[100px] rounded-lg shadow-sm">`;
  }
}

function clearIcon(): void {
  currentIcon = null;
  const uploadPreview = findElement('upload-preview');
  const aiPreview = findElement('ai-preview');
  const iconUpload = requireInput('icon-upload');

  if (uploadPreview) uploadPreview.innerHTML = '';
  if (aiPreview) aiPreview.innerHTML = '';
  iconUpload.value = '';
}

async function handleGenerateQRCode(): Promise<void> {
  const config = readQRCodeFormConfig();
  if (!config) {
    showModal({
      type: 'warning',
      title: 'Input Required',
      message: 'Please enter text or URL for the QR code.',
    });
    return;
  }

  const canvas = requireCanvas('qr-canvas');
  const downloadButton = requireButton('download-qr');
  const warningDiv = findElement('qr-warning');

  try {
    const validation = await generateQRCode(canvas, config);

    if (warningDiv) {
      if (validation?.kind === 'invalid') {
        warningDiv.textContent = validation.error;
        warningDiv.classList.remove('hidden');
      } else {
        warningDiv.classList.add('hidden');
      }
    }

    canvas.classList.remove('hidden');
    downloadButton.disabled = false;
  } catch (error) {
    showModal({
      type: 'error',
      title: 'Generation Failed',
      message:
        error instanceof Error ? error.message : 'Error generating QR code. Please try again.',
    });
  }
}

function handleDownloadQRCode(): void {
  downloadQRCode(requireCanvas('qr-canvas'));
}

async function generateAIIcon(): Promise<void> {
  const promptInput = requireInput('ai-prompt');
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showModal({
      type: 'warning',
      title: 'Description Required',
      message: 'Please enter a description for the icon you want to generate.',
    });
    return;
  }

  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (!apiKey) {
    showModal({
      type: 'warning',
      title: 'API Key Required',
      message: 'Please enter your Gemini API key in the settings below.',
    });
    return;
  }

  if (!checkRateLimit()) {
    updateRateLimitDisplay();
    return;
  }

  const button = requireButton('generate-icon');
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Generating...';

  try {
    const response = await generateImageWithGemini(apiKey, prompt);
    if (response) {
      currentIcon = response;
      displayIcon(response, 'ai-preview');
      incrementRateLimit();
      updateRateLimitDisplay();
    }
  } catch (error) {
    console.error('Error generating AI icon:', error);
    showModal({
      type: 'error',
      title: 'Generation Failed',
      message: 'Error generating icon. Please check your API key and try again.',
    });
  } finally {
    button.disabled = false;
    button.textContent = 'Generate Icon';
  }
}

function saveApiKey(): void {
  const apiKey = requireInput('api-key').value.trim();

  if (apiKey) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    updateApiKeyUI(true);
    showModal({
      type: 'success',
      title: 'Success',
      message: 'API key saved successfully!',
    });
  }
}

function loadApiKey(): void {
  const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  const apiKeyInput = requireInput('api-key');

  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  updateApiKeyUI(!!savedKey);
}

function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  requireInput('api-key').value = '';
  updateApiKeyUI(false);
  showModal({
    type: 'success',
    title: 'Success',
    message: 'API key cleared successfully.',
  });
}

function updateApiKeyUI(hasApiKey: boolean): void {
  const generateTab = document.querySelector<HTMLButtonElement>('[data-tab="generate"]');
  const generateButton = requireButton('generate-icon');
  const aiPromptInput = requireInput('ai-prompt');

  if (generateTab) {
    if (!hasApiKey) {
      generateTab.classList.add('opacity-50', 'cursor-not-allowed');
      generateTab.setAttribute('title', 'API key required - Configure in settings below');
    } else {
      generateTab.classList.remove('opacity-50', 'cursor-not-allowed');
      generateTab.removeAttribute('title');
    }
  }

  generateButton.disabled = !hasApiKey;
  if (!hasApiKey) {
    generateButton.setAttribute('title', 'API key required');
  } else {
    generateButton.removeAttribute('title');
  }

  aiPromptInput.disabled = !hasApiKey;
  aiPromptInput.placeholder = hasApiKey
    ? 'Describe the icon you want...'
    : 'API key required - Configure in settings below';
}

function loadSystemPrompt(): void {
  const savedPrompt = localStorage.getItem(GEMINI_PROMPT_STORAGE_KEY);
  requireTextarea('system-prompt').value = savedPrompt || DEFAULT_GEMINI_PROMPT;
}

function saveSystemPrompt(): void {
  const prompt = requireTextarea('system-prompt').value.trim();

  if (prompt) {
    localStorage.setItem(GEMINI_PROMPT_STORAGE_KEY, prompt);
    showModal({
      type: 'success',
      title: 'Success',
      message: 'System prompt saved successfully!',
    });
  }
}

function resetSystemPrompt(): void {
  localStorage.removeItem(GEMINI_PROMPT_STORAGE_KEY);
  requireTextarea('system-prompt').value = DEFAULT_GEMINI_PROMPT;

  showModal({
    type: 'success',
    title: 'Success',
    message: 'System prompt reset to default.',
  });
}

function loadModel(): void {
  const savedModel = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  requireInput('gemini-model').value = savedModel || DEFAULT_GEMINI_MODEL;
}
