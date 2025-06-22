import {
  API_KEY_STORAGE_KEY,
  DEFAULT_GEMINI_PROMPT,
  DEFAULT_QR_SIZE,
  GEMINI_PROMPT_STORAGE_KEY,
  GEMINI_MODEL_STORAGE_KEY,
} from './constants';
import { generateImageWithGemini } from './gemini';
import { showModal } from './modal';
import { downloadQRCode, generateQRCode } from './qrCode';
import { checkRateLimit, incrementRateLimit, updateRateLimitDisplay } from './rateLimit';
import type { TabType } from './types';

// State
let currentIcon: string | null = null;

// Initialize
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
      const targetTab = button.dataset.tab as TabType;

      // Check if generate tab is clicked without API key
      if (targetTab === 'generate') {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!apiKey) {
          showModal({
            type: 'warning',
            title: 'API Key Required',
            message:
              'Please configure your Gemini API key in the settings below to use AI generation.',
          });
          return;
        }
      }

      tabButtons.forEach((btn) => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-600');
      });
      tabContents.forEach((content) => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });

      button.classList.add('active', 'bg-blue-600', 'text-white');
      button.classList.remove('bg-gray-100', 'text-gray-600');
      const tabElement = document.getElementById(`${targetTab}-tab`);
      if (tabElement) {
        tabElement.classList.add('active');
        tabElement.classList.remove('hidden');
      }
    });
  });
}

function initializeEventListeners(): void {
  // QR generation
  const generateButton = document.getElementById('generate-qr');
  const downloadButton = document.getElementById('download-qr');
  const qrTextInput = document.getElementById('qr-text') as HTMLInputElement;

  if (generateButton) {
    generateButton.addEventListener('click', handleGenerateQRCode);
  }
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadQRCode);
  }
  if (qrTextInput) {
    qrTextInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGenerateQRCode();
      }
    });
  }

  // Icon upload
  const iconUpload = document.getElementById('icon-upload') as HTMLInputElement;
  const clearButton = document.getElementById('clear-icon');
  if (iconUpload) {
    iconUpload.addEventListener('change', handleIconUpload);
  }
  if (clearButton) {
    clearButton.addEventListener('click', clearIcon);
  }

  // AI icon generation
  const generateIconButton = document.getElementById('generate-icon');
  const aiPromptInput = document.getElementById('ai-prompt') as HTMLInputElement;

  if (generateIconButton) {
    generateIconButton.addEventListener('click', generateAIIcon);
  }

  if (aiPromptInput) {
    aiPromptInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        generateAIIcon();
      }
    });
  }

  // API key management
  const saveApiKeyButton = document.getElementById('save-api-key');
  const clearApiKeyButton = document.getElementById('clear-api-key');
  if (saveApiKeyButton) {
    saveApiKeyButton.addEventListener('click', saveApiKey);
  }
  if (clearApiKeyButton) {
    clearApiKeyButton.addEventListener('click', clearApiKey);
  }

  // System prompt management
  const savePromptButton = document.getElementById('save-prompt');
  const resetPromptButton = document.getElementById('reset-prompt');
  if (savePromptButton) {
    savePromptButton.addEventListener('click', saveSystemPrompt);
  }
  if (resetPromptButton) {
    resetPromptButton.addEventListener('click', resetSystemPrompt);
  }

  // Model management
  const modelInput = document.getElementById('gemini-model') as HTMLInputElement;
  if (modelInput) {
    modelInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const model = target.value.trim();
      if (model) {
        localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
      }
    });
  }

  // Size slider
  const sizeSlider = document.getElementById('qr-size') as HTMLInputElement;
  const sizeDisplay = document.getElementById('size-display');
  if (sizeSlider && sizeDisplay) {
    sizeSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      sizeDisplay.textContent = `${target.value}px`;
    });
  }

  // Logo size slider
  const logoSlider = document.getElementById('logo-size') as HTMLInputElement;
  const logoDisplay = document.getElementById('logo-size-display');
  if (logoSlider && logoDisplay) {
    logoSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = Number.parseInt(target.value);
      logoDisplay.textContent = `${value}%`;

      // Add visual warning for large sizes
      if (value > 25) {
        logoDisplay.classList.add('text-amber-600');
        logoDisplay.setAttribute('title', 'Large logos may affect QR code scanning');
      } else {
        logoDisplay.classList.remove('text-amber-600');
        logoDisplay.removeAttribute('title');
      }
    });
  }

  // Border size slider
  const borderSlider = document.getElementById('border-size') as HTMLInputElement;
  const borderDisplay = document.getElementById('border-size-display');
  if (borderSlider && borderDisplay) {
    borderSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      borderDisplay.textContent = `${target.value}%`; // Changed to %
    });
  }

  // Transparent background checkbox
  const transparentCheckbox = document.getElementById('transparent-bg') as HTMLInputElement;
  const borderControl = document.getElementById('border-size-control');
  if (transparentCheckbox && borderControl) {
    transparentCheckbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        borderControl.classList.add('opacity-50', 'pointer-events-none');
      } else {
        borderControl.classList.remove('opacity-50', 'pointer-events-none');
      }
    });
  }
}

function handleIconUpload(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      currentIcon = e.target.result as string;
      displayIcon(currentIcon, 'upload-preview');
    }
  };
  reader.readAsDataURL(file);
}

function displayIcon(src: string, containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<img src="${src}" alt="Icon preview" class="max-w-[100px] max-h-[100px] rounded-lg shadow-sm">`;
  }
}

function clearIcon(): void {
  currentIcon = null;
  const uploadPreview = document.getElementById('upload-preview');
  const aiPreview = document.getElementById('ai-preview');
  const iconUpload = document.getElementById('icon-upload') as HTMLInputElement;

  if (uploadPreview) uploadPreview.innerHTML = '';
  if (aiPreview) aiPreview.innerHTML = '';
  if (iconUpload) iconUpload.value = '';
}

async function handleGenerateQRCode(): Promise<void> {
  const textInput = document.getElementById('qr-text') as HTMLInputElement;
  const sizeInput = document.getElementById('qr-size') as HTMLInputElement;

  const text = textInput?.value.trim();
  if (!text) {
    showModal({
      type: 'warning',
      title: 'Input Required',
      message: 'Please enter text or URL for the QR code.',
    });
    return;
  }

  const size = Number.parseInt(sizeInput?.value || DEFAULT_QR_SIZE.toString());

  try {
    await generateQRCode(text, size, currentIcon);
  } catch (error) {
    showModal({
      type: 'error',
      title: 'Generation Failed',
      message:
        error instanceof Error ? error.message : 'Error generating QR code. Please try again.',
    });
  }
}

async function generateAIIcon(): Promise<void> {
  const promptInput = document.getElementById('ai-prompt') as HTMLInputElement;
  const prompt = promptInput?.value.trim();

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

  // Check rate limit
  if (!checkRateLimit()) {
    updateRateLimitDisplay();
    return;
  }

  const button = document.getElementById('generate-icon') as HTMLButtonElement;
  if (!button) return;

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

// API key management
function saveApiKey(): void {
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const apiKey = apiKeyInput?.value.trim();

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
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;

  if (savedKey && apiKeyInput) {
    apiKeyInput.value = savedKey;
  }

  // Update UI based on API key availability
  updateApiKeyUI(!!savedKey);
}

function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  if (apiKeyInput) {
    apiKeyInput.value = '';
  }
  updateApiKeyUI(false);
  showModal({
    type: 'success',
    title: 'Success',
    message: 'API key cleared successfully.',
  });
}

function updateApiKeyUI(hasApiKey: boolean): void {
  const generateTab = document.querySelector('[data-tab="generate"]') as HTMLButtonElement;
  const generateButton = document.getElementById('generate-icon') as HTMLButtonElement;
  const aiPromptInput = document.getElementById('ai-prompt') as HTMLInputElement;

  if (generateTab) {
    if (!hasApiKey) {
      generateTab.classList.add('opacity-50', 'cursor-not-allowed');
      generateTab.setAttribute('title', 'API key required - Configure in settings below');
    } else {
      generateTab.classList.remove('opacity-50', 'cursor-not-allowed');
      generateTab.removeAttribute('title');
    }
  }

  if (generateButton) {
    generateButton.disabled = !hasApiKey;
    if (!hasApiKey) {
      generateButton.setAttribute('title', 'API key required');
    } else {
      generateButton.removeAttribute('title');
    }
  }

  if (aiPromptInput) {
    aiPromptInput.disabled = !hasApiKey;
    if (!hasApiKey) {
      aiPromptInput.placeholder = 'API key required - Configure in settings below';
    } else {
      aiPromptInput.placeholder = 'Describe the icon you want...';
    }
  }
}

// System prompt management
function loadSystemPrompt(): void {
  const savedPrompt = localStorage.getItem(GEMINI_PROMPT_STORAGE_KEY);
  const promptTextarea = document.getElementById('system-prompt') as HTMLTextAreaElement;

  if (promptTextarea) {
    promptTextarea.value = savedPrompt || DEFAULT_GEMINI_PROMPT;
  }
}

function saveSystemPrompt(): void {
  const promptTextarea = document.getElementById('system-prompt') as HTMLTextAreaElement;
  const prompt = promptTextarea?.value.trim();

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
  const promptTextarea = document.getElementById('system-prompt') as HTMLTextAreaElement;

  if (promptTextarea) {
    promptTextarea.value = DEFAULT_GEMINI_PROMPT;
  }

  showModal({
    type: 'success',
    title: 'Success',
    message: 'System prompt reset to default.',
  });
}

// Model management
function loadModel(): void {
  const savedModel = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  const modelInput = document.getElementById('gemini-model') as HTMLInputElement;
  
  if (modelInput) {
    modelInput.value = savedModel || 'gemini-2.5-flash';
  }
}
