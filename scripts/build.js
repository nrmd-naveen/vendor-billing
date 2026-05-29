/**
 * Full production build → outputs installer to dist/
 *   npm run build
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function run(cmd, opts = {}) {
  console.log('\n▶', cmd)
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts })
}

// ── 1. Build Next.js (standalone output) ─────────────────────────────────────
run('npx next build')

// ── 2. Assemble the standalone server bundle ──────────────────────────────────
const standaloneDir = path.join(root, '.next', 'standalone')
const serverDir     = path.join(root, 'server')

if (!fs.existsSync(standaloneDir)) {
  console.error('\n❌ .next/standalone not found — is output: "standalone" set in next.config.ts?')
  process.exit(1)
}

console.log('\n▶ Assembling server bundle…')
fs.rmSync(serverDir, { recursive: true, force: true })
fs.cpSync(standaloneDir, serverDir, { recursive: true })
fs.cpSync(
  path.join(root, '.next', 'static'),
  path.join(serverDir, '.next', 'static'),
  { recursive: true }
)
fs.cpSync(path.join(root, 'public'), path.join(serverDir, 'public'), { recursive: true })
console.log('   Server bundle ready at server/')

// ── 3. Compile Electron TypeScript ────────────────────────────────────────────
run('npx tsc -p tsconfig.electron.json')

// ── 3b. Apply 7za shim (prevents macOS-symlink extraction error on Windows) ──
// electron-builder downloads winCodeSign which contains macOS symlinks;
// this shim makes 7za.exe exit 0 even when symlink creation fails.
const shimSrc   = path.join(root, 'tools', '7za_shim.exe')
const sevenZaDir = path.join(root, 'node_modules', '7zip-bin', 'win', 'x64')
const realExe   = path.join(sevenZaDir, '7za_real.exe')
const shimDest  = path.join(sevenZaDir, '7za.exe')
if (fs.existsSync(shimSrc) && fs.existsSync(sevenZaDir)) {
  if (!fs.existsSync(realExe)) {
    fs.copyFileSync(shimDest, realExe)
  }
  fs.copyFileSync(shimSrc, shimDest)
  console.log('\n▶ 7za shim applied (suppresses macOS symlink errors)')
}

// ── 4. Package with electron-builder ─────────────────────────────────────────
// CSC_LINK='' tells electron-builder to skip code signing + avoids the
// winCodeSign symlink extraction issue on Windows without Developer Mode
run('npx electron-builder --win', {
  env: { ...process.env, CSC_LINK: '', WIN_CSC_LINK: '', CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
})

console.log('\n✅ Build complete! Installer is in dist/')
