import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  pickDb: () => ipcRenderer.invoke('pickDb') as Promise<string|null>,
  onExportCsv: (cb: () => void) => ipcRenderer.on('export-csv', () => cb()),
  openDb: (p: string) => ipcRenderer.invoke('openDb', p) as Promise<boolean>,
  getTables: () => ipcRenderer.invoke('getTables') as Promise<string[]>,
  loadRows: (t: string, limit?: number) =>
    ipcRenderer.invoke('loadRows', t, limit) as Promise<{
      columns: string[]
      rows: any[]
      foreignKeys: { table: string; from: string; to: string }[]
    }>,
  loadRowsFiltered: (t: string, value: string | number, col?: string) =>
    ipcRenderer.invoke('loadRowsFiltered', t, value, col) as Promise<{
      columns: string[]
      rows: any[]
      foreignKeys: { table: string; from: string; to: string }[]
    }>,
  onAssetsDirChanged: (cb: (dir: string) => void) => ipcRenderer.on('assets-dir-changed', (_e, d) => cb(d)),
  openAsset: (fileName: string) => ipcRenderer.invoke('openAsset', fileName) as Promise<{ ok: boolean; path: string; reason?: string }>
})