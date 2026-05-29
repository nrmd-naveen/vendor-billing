/**
 * Generate a license key for a client machine.
 *   node scripts/generate-license.js <machineId>
 *
 * The client sees their Machine ID on the activation screen.
 * They send it to you → you run this → send back the license key.
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const os = require('os')

const machineId = process.argv[2]

if (!machineId) {
  console.error('Usage:  node scripts/generate-license.js <machineId>')
  console.error('Example: node scripts/generate-license.js abc123def456...')
  process.exit(1)
}

const privateKeyPath = path.join(os.homedir(), 'vb-private.pem')

if (!fs.existsSync(privateKeyPath)) {
  console.error('❌ Private key not found at:', privateKeyPath)
  console.error('   Run: node scripts/generate-keys.js  first.')
  process.exit(1)
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf-8')

const sign = crypto.createSign('RSA-SHA256')
sign.update(machineId)
const licenseKey = sign.sign(privateKey).toString('base64')

console.log('\n✅ License Key Generated')
console.log('Machine ID :', machineId)
console.log('─'.repeat(60))
console.log('License Key (send this to the client):')
console.log('─'.repeat(60))
console.log(licenseKey)
console.log('─'.repeat(60))
