/**
 * Run ONCE to create your RSA key pair.
 *   node scripts/generate-keys.js
 *
 * - Private key → saved to %USERPROFILE%\vb-private.pem  (keep this SECRET)
 * - Public key  → paste into electron/license.ts
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const os = require('os')

const privateKeyPath = path.join(os.homedir(), 'vb-private.pem')

if (fs.existsSync(privateKeyPath)) {
  console.log('⚠️  Key already exists at:', privateKeyPath)
  console.log('   Delete it first if you really want to regenerate (this will INVALIDATE all existing licenses).')
  process.exit(0)
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 })

console.log('✅ Private key saved to:', privateKeyPath)
console.log('⚠️  Keep this file SAFE and NEVER commit it to git.\n')
console.log('─────────────────────────────────────────────────────────')
console.log('Paste the following into electron/license.ts')
console.log('(replace the PASTE_PUBLIC_KEY_HERE placeholder):')
console.log('─────────────────────────────────────────────────────────\n')
console.log(publicKey)
