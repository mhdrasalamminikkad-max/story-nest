const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - exposes safe IPC methods to renderer process
 * This runs in the renderer context with access to Node.js APIs
 */
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    /**
     * Invoke IPC method and return promise
     */
    invoke: (channel, ...args) => {
      // Whitelist allowed channels for security
      const validChannels = ['enter-child-mode', 'exit-child-mode'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
  },
});


