/// <reference types="vite/client" />

interface ElectronAPI {
  serverUrl: string | null;
  onServerReady: (callback: (url: string) => void) => void;
  openFileDialog: (filters: { name: string; extensions: string[] }[]) => Promise<string | null>;
  getAppVersion: () => Promise<string>;
  platform: string;
}

interface Window {
  electronAPI?: ElectronAPI;
}
