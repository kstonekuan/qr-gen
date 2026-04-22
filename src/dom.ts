// Parse-at-boundary helpers: look up a DOM element once, assert its type, and
// return a typed reference. Callers never need to cast after this.

function requireElement<T extends HTMLElement>(
  id: string,
  ctor: new (...args: never[]) => T,
  label: string,
): T {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`#${id} is missing or not a ${label}`);
  }
  return element;
}

export function requireInput(id: string): HTMLInputElement {
  return requireElement(id, HTMLInputElement, 'input');
}

export function requireTextarea(id: string): HTMLTextAreaElement {
  return requireElement(id, HTMLTextAreaElement, 'textarea');
}

export function requireButton(id: string): HTMLButtonElement {
  return requireElement(id, HTMLButtonElement, 'button');
}

export function requireCanvas(id: string): HTMLCanvasElement {
  return requireElement(id, HTMLCanvasElement, 'canvas');
}

export function findElement(id: string): HTMLElement | null {
  return document.getElementById(id);
}
