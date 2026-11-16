// Exposed by electron/preload.js when running as the desktop app. Undefined in a browser.
export interface DesktopBridge {
  isDesktop: true;
  openExternal(url: string): Promise<boolean>;
  openFloat(): void;
  closeFloat(): void;
  focusMain(): void;
  finishFromFloat(outcome: 'solved' | 'stuck'): void;
  onFinish(cb: (outcome: 'solved' | 'stuck') => void): () => void;
  onFloatClosed(cb: () => void): () => void;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}
