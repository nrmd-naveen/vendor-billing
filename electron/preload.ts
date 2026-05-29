import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: (): Promise<string> => ipcRenderer.invoke('get-machine-id'),
  activateLicense: (key: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('activate-license', key),
})
