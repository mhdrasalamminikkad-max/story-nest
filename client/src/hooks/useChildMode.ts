import { useEffect, useCallback, useState } from 'react';

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
 * Also blocks keyboard shortcuts (ESC, F11, Alt+F4, etc.)
 */
export function useChildMode() {
  const [isChildModeActive, setIsChildModeActive] = useState(false);

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

  // Block keyboard shortcuts when child mode is active
  useEffect(() => {
    if (!isChildModeActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block ESC key
      if (e.key === 'Escape') {
        e.preventDefault();
        console.log('[Child Mode] ESC key blocked');
        return;
      }

      // Block F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        console.log('[Child Mode] F11 key blocked');
        return;
      }

      // Block Alt+F4 (close window)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        console.log('[Child Mode] Alt+F4 blocked');
        return;
      }

      // Block Ctrl+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        console.log('[Child Mode] Ctrl+W blocked');
        return;
      }

      // Block Ctrl+Q / Cmd+Q (quit app)
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        console.log('[Child Mode] Ctrl+Q blocked');
        return;
      }

      // Block Tab key to prevent focus escape
      if (e.key === 'Tab') {
        e.preventDefault();
        console.log('[Child Mode] Tab key blocked');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isChildModeActive]);

  const enterChildMode = useCallback(() => {
    setIsChildModeActive(true);

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
      const success = await window.childMode.exitChildMode(password);
      if (success) {
        setIsChildModeActive(false);
      }
      return success;
    }

    // Electron IPC bridge
    if (window.electron?.ipcRenderer) {
      try {
        const success = await window.electron.ipcRenderer.invoke('exit-child-mode', password);
        if (success) {
          setIsChildModeActive(false);
        }
        return success;
      } catch (error) {
        console.error('[Child Mode] Exit error:', error);
        return false;
      }
    }

    // Web fallback - validate password client-side (NOT SECURE - for dev only)
    // PRODUCTION: Always validate in native layer
    console.warn('[Child Mode] Web fallback password check (NOT SECURE)');
    const success = password === '1234';
    if (success) {
      setIsChildModeActive(false);
    }
    return success;
  }, []);

  return {
    enterChildMode,
    exitChildMode,
    isChildModeActive,
  };
}

