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
  /** Write `home base/apps/dsa/status.json`. Resolves false when there is no Home Base folder (or it is off). Older installs lack it. */
  publishStatus?(status: unknown): Promise<boolean>;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}
