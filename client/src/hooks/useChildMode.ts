import { useEffect, useCallback } from 'react';

/**
 * Native bridge interface for Child Mode
 * Works with Android WebView and Electron
 */
interface ChildModeBridge {
  enterChildMode?: () => void;
  exitChildMode?: (password: string) => Promise<boolean>;
}

declare global {
  interface Window {
    childMode?: ChildModeBridge;
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

/**
 * Hook for managing Child Mode lock functionality
 * Calls native bridge methods when available (Android/Electron)
 */
export function useChildMode() {
  // Initialize window.childMode if it doesn't exist (for Android bridge)
  useEffect(() => {
    // Android WebView exposes JavaScriptInterface as window.ChildMode (capital C)
    if (!window.childMode && (window as any).ChildMode) {
      const androidBridge = (window as any).ChildMode;
      window.childMode = {
        enterChildMode: () => androidBridge.enterChildMode(),
        exitChildMode: (password: string) => {
          return new Promise<boolean>((resolve) => {
            // Set up callback for async result
            if (!window.childMode) {
              window.childMode = {};
            }
            window.childMode._exitCallback = (success: boolean) => {
              resolve(success);
            };
            // Call native method
            androidBridge.exitChildMode(password);
          });
        },
      };
    }
  }, []);

  const enterChildMode = useCallback(() => {
    // Android WebView bridge
    if (window.childMode?.enterChildMode) {
      window.childMode.enterChildMode();
      return;
    }

    // Electron IPC bridge
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('enter-child-mode').catch(console.error);
      return;
    }

    // Web fallback - log for debugging
    console.log('[Child Mode] enterChildMode called (web mode - no native lock)');
  }, []);

  const exitChildMode = useCallback(async (password: string): Promise<boolean> => {
    // Android WebView bridge
    if (window.childMode?.exitChildMode) {
      // Use the already-wrapped exitChildMode from initialization
      return await window.childMode.exitChildMode(password);
    }

    // Electron IPC bridge
    if (window.electron?.ipcRenderer) {
      try {
        return await window.electron.ipcRenderer.invoke('exit-child-mode', password);
      } catch (error) {
        console.error('[Child Mode] Exit error:', error);
        return false;
      }
    }

    // Web fallback - validate password client-side (NOT SECURE - for dev only)
    // PRODUCTION: Always validate in native layer
    console.warn('[Child Mode] Web fallback password check (NOT SECURE)');
    return password === '1234';
  }, []);

  return {
    enterChildMode,
    exitChildMode,
  };
}

