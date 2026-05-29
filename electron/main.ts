import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'
import log from 'electron-log/main'
import { isLicensed, getMachineId, verifyLicense, saveLicense } from './license'

// Log file: %APPDATA%\Vendor Billing\logs\main.log
log.initialize()
log.transports.file.level = 'debug'
log.transports.console.level = 'debug'
log.info('App starting', { version: app.getVersion(), packaged: app.isPackaged })

const isDev = !app.isPackaged
const PORT = 37821

let serverProcess: ChildProcess | null = null
let mainWindow: BrowserWindow | null = null

// ── Server ────────────────────────────────────────────────────────────────────

function waitForServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 45_000
    const attempt = () => {
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.destroy()
        resolve()
      }).on('error', () => {
        if (Date.now() > deadline) reject(new Error('Server start timed out'))
        else setTimeout(attempt, 700)
      })
    }
    attempt()
  })
}

function spawnServer(): ChildProcess {
  const serverDir = isDev
    ? path.join(__dirname, '..', '.next', 'standalone')
    : path.join(process.resourcesPath, 'server')

  const serverScript = path.join(serverDir, 'server.js')

  // node:sqlite needs --experimental-sqlite flag before Node.js 22.10
  const [major, minor] = process.versions.node.split('.').map(Number)
  const needsFlag = major === 22 && minor < 10
  const args = needsFlag ? ['--experimental-sqlite', serverScript] : [serverScript]

  const proc = spawn(process.execPath, args, {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      DB_PATH: path.join(app.getPath('userData'), 'database.db'),
    },
    cwd: serverDir,
    stdio: 'pipe',
  })

  proc.stdout?.on('data', (d: Buffer) => log.info('[next]', d.toString().trim()))
  proc.stderr?.on('data', (d: Buffer) => log.warn('[next]', d.toString().trim()))
  proc.on('error', (err) => log.error('[next] process error:', err))

  return proc
}

// ── Windows ───────────────────────────────────────────────────────────────────

function createSplash(): BrowserWindow {
  const w = new BrowserWindow({
    width: 360,
    height: 160,
    frame: false,
    center: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  })
  w.loadURL(
    `data:text/html,<body style="margin:0;background:%230f172a;color:%2394a3b8;` +
    `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
    `height:100vh;font-family:system-ui,sans-serif;gap:10px">` +
    `<div style="font-size:20px;font-weight:700;color:%23e2e8f0">Vendor Billing</div>` +
    `<div style="font-size:13px">Starting, please wait…</div></body>`
  )
  return w
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    show: false,
    title: 'Vendor Billing',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  const url = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${PORT}`
  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })

  if (isDev) mainWindow.webContents.openDevTools()
}

function createLicenseWindow(): void {
  const win = new BrowserWindow({
    width: 520,
    height: 500,
    resizable: false,
    maximizable: false,
    title: 'Activate Vendor Billing',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.loadFile(path.join(__dirname, '..', 'electron', 'license-window.html'))
  win.on('closed', () => { if (!mainWindow) app.quit() })
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('get-machine-id', () => getMachineId())

ipcMain.handle('activate-license', async (_evt, key: string) => {
  const id = getMachineId()
  if (!verifyLicense(key.trim(), id)) {
    log.warn('License activation failed for machine:', id)
    return { success: false, error: 'Invalid license key. Please check and try again.' }
  }
  log.info('License activated for machine:', id)
  saveLicense(key.trim())
  setTimeout(() => {
    BrowserWindow.getAllWindows()
      .filter(w => w.getTitle() === 'Activate Vendor Billing')
      .forEach(w => w.destroy())
    boot()
  }, 400)
  return { success: true }
})

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  log.info('boot() started')
  const splash = createSplash()

  if (!isDev) {
    log.info('Spawning Next.js server on port', PORT)
    serverProcess = spawnServer()
  }

  try {
    if (!isDev) await waitForServer(PORT)
    log.info('Server ready — opening main window')
    splash.close()
    createMainWindow()
  } catch (err) {
    log.error('Server failed to start:', err)
    splash.close()
    dialog.showErrorBox('Startup Error', 'Could not start the application server.\nPlease restart.')
    app.quit()
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (isDev || isLicensed()) {
    boot()
  } else {
    log.info('No valid license found — showing activation window')
    createLicenseWindow()
  }
})

app.on('before-quit', () => serverProcess?.kill())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    serverProcess?.kill()
    app.quit()
  }
})
