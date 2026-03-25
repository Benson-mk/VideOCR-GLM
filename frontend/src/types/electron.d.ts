/**
 * Electron API type definitions
 * These types are exposed to the renderer process via contextBridge
 */

export interface ElectronAPI {
  getAppVersion(): Promise<string>;
  getAppPath(): Promise<string>;
  getPythonCliPath(): Promise<string>;
  selectDirectory(): Promise<string | null>;
  selectFile(): Promise<string | null>;
  on(channel: string, callback: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};