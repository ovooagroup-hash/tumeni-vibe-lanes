type FocusListener = (activeId: string | null) => void;

let currentFocusId: string | null = null;
const listeners = new Set<FocusListener>();

export function getActiveMediaFocus(): string | null {
  return currentFocusId;
}

export function claimMediaFocus(id: string): void {
  if (currentFocusId === id) return;
  currentFocusId = id;
  listeners.forEach((fn) => {
    try {
      fn(currentFocusId);
    } catch {
      /* ignore listener errors */
    }
  });
}

export function releaseMediaFocus(id: string): void {
  if (currentFocusId !== id) return;
  currentFocusId = null;
  listeners.forEach((fn) => {
    try {
      fn(null);
    } catch {
      /* ignore listener errors */
    }
  });
}

export function clearAllMediaFocus(): void {
  if (currentFocusId === null) return;
  currentFocusId = null;
  listeners.forEach((fn) => {
    try {
      fn(null);
    } catch {
      /* ignore listener errors */
    }
  });
}

export function subscribeMediaFocus(listener: FocusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
