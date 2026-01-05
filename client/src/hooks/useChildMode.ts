import { useEffect, useCallback, useState } from 'react';

/**
 * Native bridge interface for Child Mode
 * Works with Android WebView and Electron
 */
interface ChildModeBridge {
  enterChildMode?: () => void;
  exitChildMode?: (password: string) => Promise<boolean>;
  _exitCallback?: (success: boolean) => void;
}

declare global {
  interface Window {
    childMode?: ChildModeBridge;
    androidChildMode?: ChildModeBridge;
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
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] ESC key blocked');
        return false;
      }

      // Block F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] F11 key blocked');
        return false;
      }

      // Block F12, F5, etc.
      if (['F5', 'F12'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log(`[Child Mode] ${e.key} blocked`);
        return false;
      }

      // Block Alt+F4 (close window)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] Alt+F4 blocked');
        return false;
      }

      // Block Ctrl+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] Ctrl+W blocked');
        return false;
      }

      // Block Ctrl+Q / Cmd+Q (quit app)
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] Ctrl+Q blocked');
        return false;
      }

      // Block Tab key to prevent focus escape
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log('[Child Mode] Tab key blocked');
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Escape', 'F11', 'F5', 'F12'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    // Block fullscreen exit by preventing ESC
    const handleFullscreenChange = () => {
      console.log('[Child Mode] Fullscreen event detected');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

