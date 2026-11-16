// Floating timer = Document Picture-in-Picture (Chrome / Edge 116+). An always-on-top
// mini window whose DOM we own, so React can render the timer and hints into it while
// LeetCode has the rest of the screen.
//
// Both requestWindow() and window.open() need the click's "user activation", and each
// uses it up, so one click can't open both (checked in real Chrome with the popup
// blocker on). Start floats the timer; the float's first button opens LeetCode. A click
// inside the float also counts for the app window, so that window.open is allowed.

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}

function api(): DocumentPictureInPicture | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture ?? null;
}

export function canFloat(): boolean {
  return api() !== null;
}

export const FLOAT_SIZE = { width: 300, height: 390 };

/** Call synchronously inside a click handler. Returns null when unsupported. */
export function requestFloat(): Promise<Window> | null {
  const pip = api();
  if (!pip) return null;
  if (pip.window) return Promise.resolve(pip.window);
  try {
    const promise = pip.requestWindow(FLOAT_SIZE);
    promise.catch(() => {}); // the caller decides what to do; never an unhandled rejection
    return promise;
  } catch {
    return null;
  }
}

/** Copy the app's styles and theme into the PiP document so the panel looks like the app. */
export function preparePipDocument(pipWin: Window) {
  const doc = pipWin.document;
  doc.title = 'Timer';
  doc.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') ?? 'dark');
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = doc.createElement('style');
      // Root-relative url()s (fonts) must become absolute: the PiP document is about:blank.
      style.textContent = Array.from(sheet.cssRules, r => r.cssText)
        .join('\n')
        .replace(/url\((['"]?)\/(?!\/)/g, `url($1${location.origin}/`);
      doc.head.appendChild(style);
    } catch {
      if (sheet.href) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        doc.head.appendChild(link);
      }
    }
  }
}
