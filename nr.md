  Overall Architecture                                     

  Your app went from a Next.js web app → native Windows desktop app with this
   structure:

  npm run build
       │
       ├─ 1. next build          → .next/standalone/  (Next.js server)
       ├─ 2. prepare server      → server/             (copied bundle)
       ├─ 3. tsc (electron/)     → dist-electron/      (Electron main
  process)
       └─ 4. electron-builder    → dist/*.exe          (Windows installer)

  ---
  Part 1: The Electron Wrapper

  Electron is a framework that bundles Chromium (browser) + Node.js into a
  desktop .exe. Your app runs inside it.

  The problem with Next.js + Electron:
  Next.js is a server-side framework — it needs a running HTTP server to
  handle API routes (your SQLite calls). You can't just open index.html as a
  file. So the architecture is:

  ┌─────────────────────────────────────┐
  │         Electron Process            │
  │                                     │
  │  ┌──────────────────────────────┐   │
  │  │  Main Process (Node.js)      │   │
  │  │  electron/main.ts            │   │
  │  │                              │   │
  │  │  1. Check license            │   │
  │  │  2. Spawn Next.js server     │   │  ← runs server/server.js
  │  │  3. Wait for port 37821      │   │     as a child process
  │  │  4. Open browser window      │   │
  │  └──────────────────────────────┘   │
  │                                     │
  │  ┌──────────────────────────────┐   │
  │  │  Renderer Process (Chromium) │   │
  │  │  Loads http://127.0.0.1:37821│   │  ← your Next.js UI
  │  └──────────────────────────────┘   │
  └─────────────────────────────────────┘

  output: 'standalone' in next.config.ts:
  Next.js 15 has a mode that packages everything needed to run the server
  into one folder (.next/standalone/) — including a minimal node_modules/
  with only the required deps. Without this, you'd need to ship ALL of
  node_modules/ (2 GB+). The standalone output is ~30 MB.

  ELECTRON_RUN_AS_NODE=1:
  Electron's binary can behave as a regular Node.js process when you set this
   env var. The main process uses this to spawn the Next.js server:

  spawn(process.execPath, ['server.js'], {
    env: { ELECTRON_RUN_AS_NODE: '1', PORT: '37821', DB_PATH: '...' }
  })

  So the same Vendor Billing.exe acts as both the Electron GUI and the
  Node.js server runner.

  DB_PATH:
  Your SQLite database path was process.cwd()/database.db. In a packaged app,
   cwd is inside the install directory (read-only). I pass DB_PATH from
  Electron pointing to AppData/Roaming/Vendor Billing/database.db — a
  writable user folder, so data survives updates.

  ---
  Part 2: The License System

  Why RSA signing?
  The license check is fully offline — no server needed. The security comes
  from asymmetric cryptography:

  You have:  Private Key  (only you)  →  SIGNS machine IDs
  App has:   Public Key   (embedded)  →  VERIFIES signatures

  A license key is just: RSA_Sign(machineId, privateKey) encoded as base64.

  How verification works at runtime:

  // electron/license.ts
  const verify = crypto.createVerify('RSA-SHA256')
  verify.update(machineId)          // the machine's hardware fingerprint
  verify.verify(PUBLIC_KEY, key)    // checks: was this signed with our
  private key?

  Because only you have the private key, nobody can forge a valid license for
   an arbitrary machine ID.

  Machine ID:
  node-machine-id reads the Windows Registry value
  HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid — a unique ID Windows
  generates when installed. It's stable across reboots and app reinstalls.

  License storage:
  Once activated, the key is saved to AppData/Roaming/Vendor
  Billing/vb-license.key. On every app start, Electron reads it and verifies
  it against the current machine ID.

  ---
  Part 3: The License Window

  Built as a standalone HTML file (electron/license-window.html) loaded by
  Electron BEFORE the Next.js server even starts. This means:

  - If no valid license → show activation screen
  - If valid → start server, show app

  The activation screen uses Electron's IPC (Inter-Process Communication) to
  talk between the HTML page and the main process:

  license-window.html
      window.electronAPI.getMachineId()
             │
      [IPC invoke 'get-machine-id']
             │
      electron/main.ts  →  returns machineIdSync()
             │
      [IPC response]
             │
      display on screen

      window.electronAPI.activateLicense(key)
             │
      [IPC invoke 'activate-license']
             │
      main.ts → verifyLicense() → saveLicense() → boot()

  The preload.ts is the bridge — it safely exposes only specific IPC calls to
   the HTML page (security boundary called Context Isolation).

  ---
  Part 4: electron-builder + the 7za Shim

  electron-builder packages everything into a Windows NSIS installer. It:
  1. Bundles your app into an ASAR archive (like a zip inside the exe)
  2. Copies server/ as extra resources outside the ASAR
  3. Runs NSIS to create the installer .exe

  The Windows symlink bug:
  electron-builder downloads a tool called winCodeSign (for code signing).
  That archive contains macOS .dylib symlinks. Windows requires Developer
  Mode to create symlinks without admin rights. Without it, 7zip exits with
  code 2 → build fails.

  The shim fix:
  Since the macOS files are irrelevant for Windows builds, I compiled a C#
  wrapper exe (tools/7za_shim.exe) that:
  1. Runs the real 7za with all the same arguments
  2. Always exits with code 0, even if 7zip failed on the macOS symlinks

  The build script replaces 7za.exe with this wrapper before electron-builder
   runs. After npm install restores the original, the build script reapplies
  the shim automatically.

  ---
  File Map

  ┌──────────────────────────────┬────────────────────────────────────────┐
  │             File             │                Purpose                 │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/main.ts             │ Electron entry point — license check,  │
  │                              │ server spawn, windows                  │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/license.ts          │ RSA verify/save/load, machine ID       │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/preload.ts          │ IPC bridge for license window          │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/license-window.html │ Activation UI                          │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ scripts/generate-keys.js     │ One-time: creates your RSA key pair    │
  │             File             │                Purpose                 │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/main.ts             │ Electron entry point — license check,  │
  │                              │ server spawn, windows                  │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/license.ts          │ RSA verify/save/load, machine ID       │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/preload.ts          │ IPC bridge for license window          │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron/license-window.html │ Activation UI                          │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ scripts/generate-keys.js     │ One-time: creates your RSA key pair    │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ scripts/generate-license.js  │ Per-client: signs their machine ID     │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ scripts/build.js             │ Orchestrates the full build pipeline   │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ tools/7za_shim.exe           │ Fixes the Windows symlink extraction   │
  │                              │ bug                                    │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ electron-builder.yml         │ Installer config (NSIS, app name,      │
  │                              │ targets)                               │
  ├──────────────────────────────┼────────────────────────────────────────┤
  │ tsconfig.electron.json       │ Compiles electron/*.ts →               │
  │                              │ dist-electron/*.js          