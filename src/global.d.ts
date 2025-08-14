export {}

declare global {
  interface Window {
    api: {
      pickDb: () => Promise<string|null>;
      openDb: (p: string) => Promise<boolean>;
      onExportCsv: (cb: () => void) => void;
      getTables: () => Promise<string[]>;
      onAssetsDirChanged: (cb: (dir: string) => void) => void;
      openAsset: (fileName: string) => Promise<{ ok: boolean; path: string; reason?: string }>;
      loadRows: (t: string, limit?: number) => Promise<{
        columns: string[];
        rows: any[];
        foreignKeys: { table: string; from: string; to: string }[];
      }>;
      loadRowsFiltered: (t: string, value: string | number, col?: string) => Promise<{
        columns: string[];
        rows: any[];
        foreignKeys: { table: string; from: string; to: string }[];
      }>;
    };
  }
}