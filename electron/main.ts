import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url';

let db: Database.Database | null = null
let win: BrowserWindow
let assetsDir: string | null = null

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs')
    },
    titleBarStyle: 'hidden',
    // expose window controls in Windows/Linux
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    autoHideMenuBar: false
    
  })
  if (process.platform === 'win32') {
    win.setMenuBarVisibility(true)
  }
  if (import.meta.env.MODE === 'development') win.webContents.openDevTools()
  
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173');
  } else {
    // dist/ è accanto a dist-electron/ dentro app.asar
    const indexHtml = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexHtml).catch(err => {
      console.error('Failed to load index.html:', err, 'path:', indexHtml);
    });
  }
}

function createMenu() {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as 'about' },
        { type: 'separator' as 'separator' },
        { role: 'quit' as 'quit' }
      ]
    }] : []),

    {
      label: 'File',
      submenu: [
        {
          label: 'Add assets folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const res = await dialog.showOpenDialog(win, {
              title: 'Select the folder containing local assets',
              properties: ['openDirectory']
            })
            if (!res.canceled && res.filePaths[0]) {
              assetsDir = res.filePaths[0];                 // <-- solo in RAM
              win.webContents.send('assets-dir-changed', assetsDir);
            }
          }
        },
        {
          label: 'Export CSV',
          accelerator: 'CmdOrCtrl+E',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('export-csv')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  // IPC: scegli file
  ipcMain.handle('pickDb', async () => {
    const res = await dialog.showOpenDialog(win, {
      title: 'Seleziona database SQLite',
      properties: ['openFile'],
      filters: [{ name: 'SQLite DB', extensions: ['db','sqlite','sqlite3'] }]
    })
    return res.canceled ? null : res.filePaths[0]
  })

  // IPC: apri DB scelto
  ipcMain.handle('openDb', (_e, filePath: string) => {
    if (db) { try { db.close() } catch {} db = null }
    db = new Database(filePath, { readonly: true, fileMustExist: true })
    return true
  })

  // IPC: elenco tabelle
  ipcMain.handle('getTables', () => {
  if (!db) throw new Error('DB non aperto')
    const rows = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `).all() as { name: string }[]
    return rows.map(r => r.name)
  })

  // IPC: righe tabella
  ipcMain.handle('loadRows', (_e, table: string) => {
    if (!db) throw new Error('DB non aperto')
    const rows = db.prepare(`SELECT * FROM "${table}"`).all()
    const columns = rows.length ? Object.keys(rows[0] as object) : []
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list("${table}")`).all()
    return { columns, rows, foreignKeys }
  })

  // IPC: carica tabella filtrata su PK (o colonna specifica)
  ipcMain.handle('loadRowsFiltered', (_e, table: string, value: string | number, column?: string) => {
    if (!db) throw new Error('DB non aperto')

    let col = column
    if (!col) {
      const info = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string; pk: 0 | 1 }>;
      col = (info.find(c => c.pk === 1) as { name: string; pk: 0 | 1 } | undefined)?.name;
      if (!col) throw new Error(`PK non trovata per tabella ${table}`)
    }

    const rows = db.prepare(`SELECT * FROM "${table}" WHERE "${col}" = ?`).all(value) as Array<Record<string, any>>;
    const columns = rows.length ? Object.keys(rows[0] as object) : [];
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list("${table}")`).all() as Array<{
      id: number; seq: number; table: string; from: string; to: string
    }>;
    return { columns, rows, foreignKeys }
  })

  ipcMain.handle('getAssetsDir', () => assetsDir)

  ipcMain.handle('setAssetsDir', (_e, dir: string | null) => {
    assetsDir = dir
    if (assetsDir) win.webContents.send('assets-dir-changed', assetsDir)
    return true
  })

  ipcMain.handle('openAsset', async (_e, fileName: string) => {
    if (!assetsDir) throw new Error('Cartella assets non impostata');
    const full = path.join(assetsDir, fileName);
    if (!fs.existsSync(full)) return { ok: false, path: full, reason: 'not_found' };
    const res = await shell.openPath(full);
    return { ok: res === '', path: full };
  });

  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
  createMenu()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })